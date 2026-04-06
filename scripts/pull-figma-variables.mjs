#!/usr/bin/env node

/**
 * Pull Figma Variables → Design Tokens
 *
 * Reads all variables from a Figma file via the REST API and writes them
 * back to the local token JSON files under tokens/.
 *
 * Required environment variables:
 *   FIGMA_ACCESS_TOKEN  – Personal access token with file_variables:read scope
 *   FIGMA_FILE_KEY      – The key from the Figma file URL
 *
 * Usage:
 *   FIGMA_ACCESS_TOKEN=xxx FIGMA_FILE_KEY=yyy node scripts/pull-figma-variables.mjs
 *   node scripts/pull-figma-variables.mjs --dry-run   # preview without writing files
 */

import { writeFileSync, existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const DRY_RUN = process.argv.includes('--dry-run');
const REQUEST_TIMEOUT_MS = 30_000;
const FIGMA_API = 'https://api.figma.com';
const TOKENS_DIR = 'tokens';

const TOKEN = process.env.FIGMA_ACCESS_TOKEN;
const FILE_KEY = process.env.FIGMA_FILE_KEY;

if (!TOKEN || !FILE_KEY) {
  console.error('Missing required env vars. Set FIGMA_ACCESS_TOKEN and FIGMA_FILE_KEY.');
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Figma API
// ---------------------------------------------------------------------------

async function figmaFetch(path) {
  const url = `${FIGMA_API}${path}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    console.log(`  → GET ${url}`);
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'X-Figma-Token': TOKEN },
    });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Figma API ${res.status}: ${body}`);
    }
    return res.json();
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error(`Figma API request timed out after ${REQUEST_TIMEOUT_MS / 1000}s`);
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

// ---------------------------------------------------------------------------
// Name conversion: Title Case → kebab-case
// ---------------------------------------------------------------------------

/** "Warm Black" → "warm-black", "XL" → "xl" */
function toKebab(str) {
  return str.toLowerCase().replace(/\s+/g, '-');
}

/**
 * Collection name → token category.
 *   "Color" → "color", "Typography" → "typography", etc.
 */
function collectionToCategory(name) {
  return name.toLowerCase();
}

// ---------------------------------------------------------------------------
// Value conversion: Figma → token JSON
// ---------------------------------------------------------------------------

/** Figma COLOR {r,g,b,a} → "#rrggbb" hex string */
function figmaColorToHex({ r, g, b }) {
  const toHex = (n) => Math.round(n * 255).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

/**
 * Infer the token type from the Figma resolvedType + the token path.
 */
function inferTokenType(resolvedType, pathSegments) {
  if (resolvedType === 'COLOR') return 'color';
  if (resolvedType === 'STRING') {
    // Check if it's a font-family by path
    if (pathSegments.some((s) => s === 'font-family')) return 'fontFamily';
    return 'string';
  }
  if (resolvedType === 'FLOAT') {
    const last = pathSegments[pathSegments.length - 1];
    if (last.includes('font-size')) return 'dimension';
    if (last.includes('font-weight') || pathSegments.some((s) => s === 'font-weight')) return 'fontWeight';
    if (last === 'line-height') return 'number';
    // Spacing and breakpoint are dimensions
    if (pathSegments[0] === 'spacing' || pathSegments[0] === 'breakpoint') return 'dimension';
    return 'number';
  }
  return 'string';
}

/**
 * Format a raw Figma value into the token JSON value string.
 */
function formatValue(figmaValue, tokenType, pathSegments) {
  if (tokenType === 'color') {
    return figmaColorToHex(figmaValue);
  }
  if (tokenType === 'dimension') {
    // Spacing tokens use rem, everything else uses px
    if (pathSegments[0] === 'spacing') {
      return `${figmaValue}rem`;
    }
    return `${figmaValue}px`;
  }
  if (tokenType === 'fontWeight') {
    return String(figmaValue);
  }
  if (tokenType === 'number') {
    // Line-height: stored as 1.1 in Figma, token uses "110%"
    return `${Math.round(figmaValue * 100)}%`;
  }
  // Shadow values stored as strings
  if (tokenType === 'string' && pathSegments[0] === 'shadow') {
    return String(figmaValue);
  }
  return String(figmaValue);
}

// ---------------------------------------------------------------------------
// File mapping: token path → which JSON file to write
// ---------------------------------------------------------------------------

/**
 * Map from token path segments to the file path and the nesting structure.
 *
 * Token files are organized as:
 *   tokens/{category}/{subcategory}.json
 *
 * The mapping rules mirror the push script's structure:
 *   color.base.*                → tokens/color/base.json
 *   color.brand.*               → tokens/color/brand.json
 *   color.contrasting.*         → tokens/color/contrasting.json
 *   color.vibrant.*             → tokens/color/vibrant.json
 *   color.{group}.*             → tokens/color/{group}.json
 *   typography.font-family.*    → tokens/typography/font-family.json
 *   typography.font-weight.*    → tokens/typography/font-weight.json
 *   typography.size.*           → tokens/typography/font-size.json
 *   spacing.scale.*             → tokens/spacing/scale.json
 *   breakpoint.screen.*         → tokens/breakpoint/screen.json
 *   shadow.elevation.*          → tokens/shadow/elevation.json
 */
function tokenFileKey(pathSegments) {
  const cat = pathSegments[0];
  const sub = pathSegments[1];

  if (cat === 'color') return `color/${sub}`;
  if (cat === 'typography') {
    if (sub === 'font-family') return 'typography/font-family';
    if (sub === 'font-weight') return 'typography/font-weight';
    if (sub === 'size') return 'typography/font-size';
    return `typography/${sub}`;
  }
  if (cat === 'spacing') return 'spacing/scale';
  if (cat === 'breakpoint') return 'breakpoint/screen';
  if (cat === 'shadow') return 'shadow/elevation';
  return `${cat}/${sub}`;
}

/**
 * Set a deeply nested value in an object, creating intermediate objects as needed.
 */
function deepSet(obj, keys, value) {
  let current = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    if (!current[keys[i]] || typeof current[keys[i]] !== 'object') {
      current[keys[i]] = {};
    }
    current = current[keys[i]];
  }
  current[keys[keys.length - 1]] = value;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log('Fetching Figma variables…');
  const data = await figmaFetch(`/v1/files/${FILE_KEY}/variables/local`);

  const collections = data.meta?.variableCollections || {};
  const variables = data.meta?.variables || {};

  // Build variable ID → variable lookup
  const varById = {};
  for (const v of Object.values(variables)) {
    varById[v.id] = v;
  }

  // Build collection ID → { name, defaultModeId }
  const collById = {};
  for (const c of Object.values(collections)) {
    collById[c.id] = {
      name: c.name,
      modeId: c.modes?.[0]?.modeId,
    };
  }

  console.log(`Found ${Object.keys(variables).length} variables in ${Object.keys(collections).length} collections.`);

  // Group tokens by file
  const fileTokens = {}; // fileKey → { path: [...], value, type }[]

  for (const v of Object.values(variables)) {
    const coll = collById[v.variableCollectionId];
    if (!coll) continue;

    const category = collectionToCategory(coll.name);
    // Variable name is Title Case without category prefix, e.g. "Base/Warm Black"
    // Convert to kebab path segments: ["base", "warm-black"]
    const nameSegments = v.name.split('/').map(toKebab);
    const fullPath = [category, ...nameSegments];

    // Get the value from the default mode
    const modeId = coll.modeId;
    const rawValue = v.valuesByMode?.[modeId];
    if (rawValue === undefined || rawValue === null) continue;

    // Check if it's a variable alias
    if (rawValue.type === 'VARIABLE_ALIAS') {
      const targetVar = varById[rawValue.id];
      if (targetVar) {
        const targetColl = collById[targetVar.variableCollectionId];
        const targetCategory = targetColl ? collectionToCategory(targetColl.name) : '';
        const targetSegments = targetVar.name.split('/').map(toKebab);
        const refPath = [targetCategory, ...targetSegments].join('.');
        const tokenType = inferTokenType(v.resolvedType, fullPath);

        const fk = tokenFileKey(fullPath);
        if (!fileTokens[fk]) fileTokens[fk] = [];
        fileTokens[fk].push({
          path: fullPath,
          value: `{${refPath}}`,
          type: tokenType === 'string' ? 'fontFamily' : tokenType,
        });
      }
      continue;
    }

    const tokenType = inferTokenType(v.resolvedType, fullPath);
    const tokenValue = formatValue(rawValue, tokenType, fullPath);

    const fk = tokenFileKey(fullPath);
    if (!fileTokens[fk]) fileTokens[fk] = [];
    fileTokens[fk].push({ path: fullPath, value: tokenValue, type: tokenType });
  }

  // Build and write JSON files
  let filesWritten = 0;
  for (const [fk, tokens] of Object.entries(fileTokens)) {
    const filePath = join(TOKENS_DIR, `${fk}.json`);
    const root = {};

    for (const { path, value, type } of tokens) {
      deepSet(root, [...path, 'value'], value);
      deepSet(root, [...path, 'type'], type);
    }

    const json = JSON.stringify(root, null, 2) + '\n';

    if (DRY_RUN) {
      console.log(`\n--- ${filePath} ---`);
      console.log(json.slice(0, 500) + (json.length > 500 ? '\n  ...(truncated)' : ''));
    } else {
      writeFileSync(filePath, json, 'utf8');
      console.log(`  ✔ ${filePath} (${tokens.length} tokens)`);
    }
    filesWritten++;
  }

  console.log(`\n${DRY_RUN ? 'Would write' : 'Wrote'} ${filesWritten} file(s).`);
  if (!DRY_RUN) {
    console.log('Run `npm run tokens` to regenerate SCSS/CSS from the updated tokens.');
  }
}

main();
