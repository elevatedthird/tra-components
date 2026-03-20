/**
 * Property 12: Token source files follow hierarchical naming
 *
 * For any token defined in a Token Source File, the token should be nested
 * under a structure matching `{category}/{subcategory}/{variant}` with at
 * least two levels of hierarchy.
 *
 * We recursively find all JSON files under `tokens/`, parse each file, walk
 * the token tree, and verify every leaf token (object with a `value` field)
 * is nested at least 2 levels deep (e.g., `color.brand.warm-black`).
 *
 * Feature: design-system-restructure, Property 12: Token source files follow hierarchical naming
 * Validates: Requirements 8.4
 */
import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import fs from 'node:fs';
import path from 'node:path';

// ── Helpers ─────────────────────────────────────────────

const TOKENS_DIR = 'tokens';

/**
 * Recursively find all JSON files under a directory.
 */
function findJsonFiles(dir) {
  const results = [];
  if (!fs.existsSync(dir)) return results;

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...findJsonFiles(fullPath));
    } else if (entry.name.endsWith('.json')) {
      results.push(fullPath);
    }
  }
  return results;
}

/**
 * Determine whether an object is a leaf token (has a `value` field).
 */
function isLeafToken(obj) {
  return (
    obj !== null &&
    typeof obj === 'object' &&
    !Array.isArray(obj) &&
    'value' in obj
  );
}

/**
 * Walk a token tree and collect all leaf tokens with their key paths and
 * nesting depth. Depth counts the number of keys traversed from the root
 * to reach the leaf (inclusive of the leaf's own key).
 *
 * For example, `{ color: { brand: { "warm-black": { value: "#281805" } } } }`
 * yields a leaf at path `color.brand.warm-black` with depth 3.
 */
function collectLeafTokens(obj, currentPath = [], results = []) {
  if (obj === null || typeof obj !== 'object' || Array.isArray(obj)) {
    return results;
  }

  for (const [key, value] of Object.entries(obj)) {
    const tokenPath = [...currentPath, key];
    if (isLeafToken(value)) {
      results.push({
        path: tokenPath.join('.'),
        depth: tokenPath.length,
      });
    } else if (typeof value === 'object' && value !== null) {
      collectLeafTokens(value, tokenPath, results);
    }
  }

  return results;
}

/**
 * Parse all token source files and return an array of
 * { file, path, depth } objects for every leaf token found.
 */
function getAllTokenEntries() {
  const jsonFiles = findJsonFiles(TOKENS_DIR);
  const entries = [];

  for (const filePath of jsonFiles) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(content);
    const leaves = collectLeafTokens(data);

    for (const leaf of leaves) {
      entries.push({
        file: filePath,
        path: leaf.path,
        depth: leaf.depth,
      });
    }
  }

  return entries;
}

// ── Property Test ───────────────────────────────────────

describe('Feature: design-system-restructure, Property 12: Token source files follow hierarchical naming', () => {
  it('should have every leaf token nested at least 2 levels deep', () => {
    /**
     * Validates: Requirements 8.4
     */
    const tokenEntries = getAllTokenEntries();

    // Ensure we actually found tokens to test
    expect(tokenEntries.length).toBeGreaterThan(0);

    fc.assert(
      fc.property(
        fc.constantFrom(...tokenEntries),
        ({ file, path: tokenPath, depth }) => {
          expect(
            depth,
            `Token "${tokenPath}" in "${file}" has depth ${depth}, but must be nested ` +
            `at least 2 levels deep (e.g., "color.brand.warm-black"). ` +
            `Tokens must follow the hierarchical naming pattern: {category}/{subcategory}/{variant}.`,
          ).toBeGreaterThanOrEqual(2);
        },
      ),
      { numRuns: Math.max(100, tokenEntries.length * 5) },
    );
  });
});
