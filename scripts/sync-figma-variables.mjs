#!/usr/bin/env node

/**
 * Sync Design Tokens → Figma Variables
 *
 * Reads all token JSON files under tokens/ and pushes them to a Figma file
 * as Variables using the Figma REST API (POST /v1/files/:file_key/variables).
 *
 * Required environment variables:
 *   FIGMA_ACCESS_TOKEN  – Personal access token or OAuth token with file:variables:write scope
 *   FIGMA_FILE_KEY      – The key from the Figma file URL (e.g. https://figma.com/design/<FILE_KEY>/...)
 *
 * Usage:
 *   FIGMA_ACCESS_TOKEN=xxx FIGMA_FILE_KEY=yyy node scripts/sync-figma-variables.mjs
 *
 * Token-type → Figma variable mapping:
 *   color       → COLOR  (collection: "Color")
 *   dimension   → FLOAT  (collection: "Spacing" | "Breakpoint" | "Typography")
 *   fontFamily  → STRING (collection: "Typography")
 *   fontWeight  → FLOAT  (collection: "Typography")
 *   number      → FLOAT  (collection: "Typography")
 *   shadow      → STRING (collection: "Shadow")  — Figma has no native shadow variable type
 */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const DRY_RUN = process.argv.includes('--dry-run');
const REQUEST_TIMEOUT_MS = 30_000; // 30 seconds

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------
const FIGMA_API = 'https://api.figma.com';
const TOKENS_DIR = 'tokens';

const TOKEN = process.env.FIGMA_ACCESS_TOKEN;
const FILE_KEY = process.env.FIGMA_FILE_KEY;

if (!DRY_RUN && (!TOKEN || !FILE_KEY)) {
  console.error(
    'Missing required env vars. Set FIGMA_ACCESS_TOKEN and FIGMA_FILE_KEY.\n' +
    'Or use --dry-run to test token reading without hitting the Figma API.'
  );
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Recursively collect all JSON files under a directory. */
function collectJsonFiles(dir) {
  const files = [];
  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry);
    if (statSync(fullPath).isDirectory()) {
      files.push(...collectJsonFiles(fullPath));
    } else if (entry.endsWith('.json')) {
      files.push(fullPath);
    }
  }
  return files;
}

/** Check if an object is a leaf token (has a `value` field). */
function isLeafToken(obj) {
  return obj !== null && typeof obj === 'object' && 'value' in obj;
}

/**
 * Flatten a nested token object into an array of
 * { path: string[], value: string, type: string } entries.
 */
function flattenTokens(obj, path = []) {
  const results = [];
  for (const [key, val] of Object.entries(obj)) {
    if (val === null || typeof val !== 'object') continue;
    if (isLeafToken(val)) {
      results.push({ path: [...path, key], value: val.value, type: val.type || 'unknown' });
    } else {
      results.push(...flattenTokens(val, [...path, key]));
    }
  }
  return results;
}

/**
 * Map a token type string to a Figma resolvedType.
 */
function resolvedType(tokenType) {
  switch (tokenType) {
    case 'color':
      return 'COLOR';
    case 'fontFamily':
      return 'STRING';
    case 'shadow':
      return 'STRING';
    case 'dimension':
    case 'fontWeight':
    case 'number':
      return 'FLOAT';
    default:
      return 'STRING';
  }
}

/**
 * Decide which Figma variable collection a token belongs to,
 * based on its top-level category.
 */
function collectionName(tokenPath) {
  const category = tokenPath[0];
  switch (category) {
    case 'color':
      return 'Color';
    case 'spacing':
      return 'Spacing';
    case 'typography':
      return 'Typography';
    case 'shadow':
      return 'Shadow';
    case 'breakpoint':
      return 'Breakpoint';
    default:
      return 'Other';
  }
}

/**
 * Convert a kebab-case string to Title Case.
 *   "warm-black" → "Warm Black"
 *   "font-size"  → "Font Size"
 *   "xl"         → "XL"
 */
function toTitleCase(str) {
  return str
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Build a Figma-friendly variable name from the token path.
 * Uses "/" as the group separator so Figma renders a folder hierarchy.
 * Strips the first segment (category) since it matches the collection name.
 * Each segment is converted from kebab-case to Title Case.
 *   e.g. ["color", "brand", "transamerica-red"] → "Brand/Transamerica Red"
 */
function variableName(tokenPath) {
  return tokenPath.slice(1).map(toTitleCase).join('/');
}

/**
 * Convert a hex color string (#RRGGBB or #RRGGBBAA) to Figma's
 * { r, g, b, a } format with 0-1 floats.
 */
function hexToFigmaColor(hex) {
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16) / 255;
  const g = parseInt(h.substring(2, 4), 16) / 255;
  const b = parseInt(h.substring(4, 6), 16) / 255;
  const a = h.length === 8 ? parseInt(h.substring(6, 8), 16) / 255 : 1;
  return { r, g, b, a };
}

/**
 * Parse a dimension string like "16px" or "1.5rem" into a plain number.
 * Figma FLOAT variables are unit-less; we store the numeric part.
 */
function parseDimension(val) {
  if (val === 'auto') return 0;
  const num = parseFloat(val);
  return isNaN(num) ? 0 : num;
}

/**
 * Parse a percentage string like "150%" into a plain number (1.5).
 */
function parsePercentage(val) {
  if (typeof val === 'string' && val.endsWith('%')) {
    return parseFloat(val) / 100;
  }
  return parseFloat(val) || 0;
}

/**
 * Check if a token value is a Style Dictionary reference (e.g. "{typography.font-family.heading}").
 */
const REFERENCE_RE = /^\{(.+)\}$/;

function isReference(value) {
  return typeof value === 'string' && REFERENCE_RE.test(value);
}

/**
 * Extract the referenced token path from a Style Dictionary reference string
 * and convert to the Title Case Figma variable name (without category prefix).
 * "{typography.font-family.heading}" → "Font Family/Heading"
 */
function referenceToName(value) {
  const match = value.match(REFERENCE_RE);
  if (!match) return null;
  return match[1].split('.').slice(1).map(toTitleCase).join('/');
}

/**
 * Convert a token value to the Figma variable value payload.
 */
function figmaValue(token) {
  const { type, value } = token;

  // References are handled separately in the main loop (as variable aliases)
  // but for dry-run display we return the raw string
  if (isReference(value)) {
    return String(value);
  }

  if (type === 'color') {
    // Handle rgba() values embedded in shadow tokens etc.
    if (typeof value === 'string' && value.startsWith('#')) {
      return hexToFigmaColor(value);
    }
    return hexToFigmaColor(value);
  }

  if (type === 'dimension') {
    return parseDimension(value);
  }

  if (type === 'fontWeight') {
    return parseFloat(value) || 400;
  }

  if (type === 'number') {
    return parsePercentage(value);
  }

  // fontFamily, shadow, and anything else → string
  return String(value);
}

// ---------------------------------------------------------------------------
// Figma API helpers
// ---------------------------------------------------------------------------

async function figmaFetch(path, options = {}) {
  const url = `${FIGMA_API}${path}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    console.log(`  → ${options.method || 'GET'} ${url}`);
    const res = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'X-Figma-Token': TOKEN,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Figma API ${res.status}: ${body}`);
    }
    return res.json();
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error(`Figma API request timed out after ${REQUEST_TIMEOUT_MS / 1000}s: ${url}`);
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

/** GET existing local variable collections + variables for the file. */
async function getLocalVariables() {
  return figmaFetch(`/v1/files/${FILE_KEY}/variables/local`);
}

/** POST variable mutations (create/update collections, modes, variables). */
async function postVariables(payload) {
  return figmaFetch(`/v1/files/${FILE_KEY}/variables`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  // 1. Read & flatten all tokens
  console.log('Reading token files…');
  const jsonFiles = collectJsonFiles(TOKENS_DIR);
  const allTokens = [];
  for (const file of jsonFiles) {
    const raw = readFileSync(file, 'utf8');
    const parsed = JSON.parse(raw);
    allTokens.push(...flattenTokens(parsed));
  }

  console.log(`Found ${allTokens.length} tokens across ${jsonFiles.length} files.`);

  if (DRY_RUN) {
    console.log('\n--- DRY RUN: Token summary (no Figma API calls) ---');
    const byCollection = {};
    for (const t of allTokens) {
      const col = collectionName(t.path);
      if (!byCollection[col]) byCollection[col] = [];
      byCollection[col].push(t);
    }
    for (const [col, tokens] of Object.entries(byCollection)) {
      console.log(`\n  Collection: ${col} (${tokens.length} variables)`);
      for (const t of tokens) {
        const val = figmaValue(t);
        const ref = isReference(t.value) ? ` → alias of ${referenceToName(t.value)}` : '';
        console.log(`    ${variableName(t.path)}  →  ${resolvedType(t.type)}  =  ${JSON.stringify(val)}${ref}`);
      }
    }
    console.log('\nDry run complete. Pass without --dry-run to push to Figma.');
    return;
  }

  // 2. Fetch existing Figma variables
  console.log('Fetching existing Figma variables…');
  const existing = await getLocalVariables();
  console.log('Fetched existing variables. Building payload…');
  const existingCollections = Object.values(existing.meta?.variableCollections || {});
  const existingVariables = Object.values(existing.meta?.variables || {});

  // Build lookup maps
  const collectionIdByName = {};
  const modeIdByCollectionName = {};
  for (const c of existingCollections) {
    collectionIdByName[c.name] = c.id;
    if (c.modes && c.modes.length > 0) {
      modeIdByCollectionName[c.name] = c.modes[0].modeId;
    }
  }

  const variableByName = {};
  for (const v of existingVariables) {
    variableByName[v.name] = v;
  }

  // 3. Group tokens by collection
  const tokensByCollection = {};
  for (const token of allTokens) {
    const col = collectionName(token.path);
    if (!tokensByCollection[col]) tokensByCollection[col] = [];
    tokensByCollection[col].push(token);
  }

  // 4. Build the payload using the correct Figma API format:
  //    { variableCollections, variableModes, variables, variableModeValues }
  const payloadCollections = [];
  const payloadModes = [];
  const payloadVariables = [];
  const payloadModeValues = [];

  let tempCollIdx = 0;

  // Separate non-ref and ref tokens (refs need to be sent after non-refs)
  const nonRefItems = [];
  const refItems = [];

  for (const [colName, tokens] of Object.entries(tokensByCollection)) {
    let collectionId = collectionIdByName[colName];
    let modeId = modeIdByCollectionName[colName];

    // Create collection if it doesn't exist
    if (!collectionId) {
      const tempCollId = `temp_coll_${tempCollIdx++}`;
      // The first mode is auto-created; we use initialModeId to reference it
      const tempModeId = `temp_mode_${colName.replace(/[^a-zA-Z0-9]/g, '_')}`;
      payloadCollections.push({
        action: 'CREATE',
        id: tempCollId,
        name: colName,
        initialModeId: tempModeId,
      });
      // UPDATE the auto-created initial mode to give it a name
      payloadModes.push({
        action: 'UPDATE',
        id: tempModeId,
        name: 'Default',
        variableCollectionId: tempCollId,
      });
      collectionId = tempCollId;
      modeId = tempModeId;
    }

    for (const token of tokens) {
      const name = variableName(token.path);
      const rType = resolvedType(token.type);
      const existingVar = variableByName[name];

      // Variable ID: use existing Figma ID or create a temp one
      const varId = existingVar
        ? existingVar.id
        : `temp_var_${name.replace(/[^a-zA-Z0-9]/g, '_')}`;

      // Variable definition (without values)
      payloadVariables.push({
        action: existingVar ? 'UPDATE' : 'CREATE',
        id: varId,
        name,
        variableCollectionId: collectionId,
        resolvedType: rType,
      });

      // Value assignment — separate into ref vs non-ref
      const item = { varId, modeId, token, name };
      if (isReference(token.value)) {
        refItems.push(item);
      } else {
        nonRefItems.push(item);
      }
    }
  }

  // Build variableModeValues for non-reference tokens
  for (const { varId, modeId, token } of nonRefItems) {
    payloadModeValues.push({
      variableId: varId,
      modeId,
      value: figmaValue(token),
    });
  }

  // For references, we need to resolve the target variable ID
  // The target might be a temp ID (if created in this same request)
  for (const { varId, modeId, token, name } of refItems) {
    const refName = referenceToName(token.value);
    const refExisting = variableByName[refName];
    // If the target exists in Figma already, use its real ID
    // Otherwise, use the temp ID we would have assigned above
    const targetId = refExisting
      ? refExisting.id
      : `temp_var_${refName.replace(/[^a-zA-Z0-9]/g, '_')}`;

    payloadModeValues.push({
      variableId: varId,
      modeId,
      value: { type: 'VARIABLE_ALIAS', id: targetId },
    });
  }

  // 5. Send everything in one request
  const payload = {};
  if (payloadCollections.length) payload.variableCollections = payloadCollections;
  if (payloadModes.length) payload.variableModes = payloadModes;
  if (payloadVariables.length) payload.variables = payloadVariables;
  if (payloadModeValues.length) payload.variableModeValues = payloadModeValues;

  if (!payloadVariables.length) {
    console.log('Nothing to sync.');
    return;
  }

  console.log(
    `Syncing ${payloadCollections.length} collection(s), ${payloadVariables.length} variable(s), ${payloadModeValues.length} value(s) to Figma…`
  );
  console.log('Payload preview (first 2 of each):');
  if (payloadCollections.length) console.log('  collections:', JSON.stringify(payloadCollections.slice(0, 2)));
  if (payloadVariables.length) console.log('  variables:', JSON.stringify(payloadVariables.slice(0, 2)));
  if (payloadModeValues.length) console.log('  modeValues:', JSON.stringify(payloadModeValues.slice(0, 2)));

  try {
    const result = await postVariables(payload);
    const tempMap = result.meta?.tempIdToRealId;
    if (tempMap) {
      console.log(`Figma assigned ${Object.keys(tempMap).length} real IDs.`);
    }
    console.log('Sync complete.');
  } catch (err) {
    console.error('Figma sync failed:', err.message);
    process.exit(1);
  }
}

main();
