#!/usr/bin/env node

/**
 * Token Source File Validator
 *
 * Scans all JSON files under tokens/ and validates:
 * 1. Valid JSON syntax
 * 2. Every leaf token object has a required `value` field
 * 3. Tokens follow a hierarchical structure with at least 2 levels of nesting
 *
 * Exits with code 0 on success, 1 on any validation failure.
 */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const TOKENS_DIR = 'tokens';
const errors = [];

/**
 * Recursively collect all JSON files under a directory.
 */
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

/**
 * Check if an object is a leaf token (has a `value` field).
 */
function isLeafToken(obj) {
  return obj !== null && typeof obj === 'object' && 'value' in obj;
}

/**
 * Recursively validate token objects within parsed JSON.
 * Tracks the current path for descriptive error messages.
 * Returns the depth of the deepest leaf token found.
 */
function validateTokenTree(obj, filePath, currentPath = [], depth = 0) {
  if (obj === null || typeof obj !== 'object' || Array.isArray(obj)) {
    return 0;
  }

  let maxLeafDepth = 0;

  for (const [key, val] of Object.entries(obj)) {
    const tokenPath = [...currentPath, key];
    const pathStr = tokenPath.join('.');

    if (val === null || typeof val !== 'object' || Array.isArray(val)) {
      errors.push(`${filePath}: "${pathStr}" — unexpected non-object value`);
      continue;
    }

    if (isLeafToken(val)) {
      // Validate required `value` field is present and non-empty
      if (val.value === undefined || val.value === null) {
        errors.push(`${filePath}: "${pathStr}" — missing required "value" field`);
      }

      // Check hierarchical depth (leaf must be at depth >= 2 from root)
      const leafDepth = depth + 1;
      if (leafDepth < 2) {
        errors.push(
          `${filePath}: "${pathStr}" — token must be nested at least 2 levels deep (found at level ${leafDepth})`
        );
      }
      maxLeafDepth = Math.max(maxLeafDepth, leafDepth);
    } else {
      // Recurse into nested group
      const childDepth = validateTokenTree(val, filePath, tokenPath, depth + 1);
      maxLeafDepth = Math.max(maxLeafDepth, childDepth);
    }
  }

  return maxLeafDepth;
}

// --- Main ---

let jsonFiles;
try {
  jsonFiles = collectJsonFiles(TOKENS_DIR);
} catch (err) {
  console.error(`Error: Could not read tokens directory "${TOKENS_DIR}": ${err.message}`);
  process.exit(1);
}

if (jsonFiles.length === 0) {
  console.error(`Error: No JSON files found under "${TOKENS_DIR}/"`);
  process.exit(1);
}

for (const filePath of jsonFiles) {
  const relPath = relative('.', filePath);

  // 1. Validate JSON syntax
  let parsed;
  try {
    const raw = readFileSync(filePath, 'utf-8');
    parsed = JSON.parse(raw);
  } catch (err) {
    errors.push(`${relPath}: Invalid JSON — ${err.message}`);
    continue;
  }

  // 2 & 3. Validate structure and required fields
  validateTokenTree(parsed, relPath);
}

if (errors.length > 0) {
  console.error('Token validation failed:\n');
  for (const err of errors) {
    console.error(`  ✗ ${err}`);
  }
  console.error(`\n${errors.length} error(s) found.`);
  process.exit(1);
}

console.log(`✓ All ${jsonFiles.length} token files are valid.`);
process.exit(0);
