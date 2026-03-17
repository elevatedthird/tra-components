/**
 * Property 3: No numeric prefixes in directory names
 *
 * For any directory in the new `src/` structure of the restructured design
 * system, the directory name should not match the pattern `^\d{2}-` (two-digit
 * numeric prefix followed by a hyphen).
 *
 * We scan only the NEW directories (base, components, utilities, vendor,
 * mixins, compat, generated) to verify the restructured layout is correct.
 * The old numeric-prefixed directories (01-global, 02-components, 03-plugable)
 * have been removed. 00-config remains as a backward-compatibility shim.
 *
 * Feature: design-system-restructure, Property 3: No numeric prefixes in directory names
 * Validates: Requirements 2.2
 */
import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import fs from 'node:fs';
import path from 'node:path';

// ── Helpers ─────────────────────────────────────────────

/** The new top-level directories to scan (excludes old numeric-prefixed dirs). */
const NEW_DIRECTORIES = [
  'src/base',
  'src/components',
  'src/utilities',
  'src/vendor',
  'src/mixins',
  'src/compat',
  'src/generated',
];

/** Pattern that should NOT appear in any new directory name. */
const NUMERIC_PREFIX_RE = /^\d{2}-/;

/**
 * Recursively collect all directory paths under a given root.
 * Excludes `node_modules/` directories.
 * Returns an array of { fullPath, dirName } objects.
 */
function collectDirectories(root) {
  const results = [];

  if (!fs.existsSync(root)) return results;

  const entries = fs.readdirSync(root, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    if (entry.name === 'node_modules') continue;

    const fullPath = path.join(root, entry.name);
    results.push({ fullPath, dirName: entry.name });
    results.push(...collectDirectories(fullPath));
  }

  return results;
}

/**
 * Collect all directories from the new directory structure.
 */
function getAllNewDirectories() {
  const allDirs = [];
  for (const dir of NEW_DIRECTORIES) {
    // Include the top-level directory itself
    if (fs.existsSync(dir)) {
      allDirs.push({ fullPath: dir, dirName: path.basename(dir) });
      allDirs.push(...collectDirectories(dir));
    }
  }
  return allDirs;
}

// ── Property Test ───────────────────────────────────────

describe('Feature: design-system-restructure, Property 3: No numeric prefixes in directory names', () => {
  it('should have no directories with two-digit numeric prefixes in the new structure', () => {
    /**
     * Validates: Requirements 2.2
     */
    const allDirs = getAllNewDirectories();

    // Ensure we actually found directories to test
    expect(allDirs.length).toBeGreaterThan(0);

    fc.assert(
      fc.property(
        fc.constantFrom(...allDirs),
        ({ fullPath, dirName }) => {
          expect(
            NUMERIC_PREFIX_RE.test(dirName),
            `Directory "${fullPath}" has a numeric prefix "${dirName}" matching /^\\d{2}-/`,
          ).toBe(false);
        },
      ),
      { numRuns: Math.max(100, allDirs.length * 5) },
    );
  });
});
