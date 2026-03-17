/**
 * Property 5: Foundation imports isolated to vendor directory
 *
 * For any SCSS file outside the `vendor/` directory, the file should not
 * contain a direct `@import` or `@use` statement referencing `foundation-sites`.
 *
 * Only files in `src/vendor/` are allowed to import from Foundation directly.
 * We scan the NEW directories (base, components, utilities, mixins, compat)
 * to verify the restructured layout correctly isolates Foundation dependencies.
 *
 * Feature: design-system-restructure, Property 5: Foundation imports isolated to vendor directory
 * Validates: Requirements 3.1
 */
import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import fs from 'node:fs';
import path from 'node:path';

// ── Helpers ─────────────────────────────────────────────

/** The new non-vendor directories to scan for Foundation imports. */
const NON_VENDOR_DIRECTORIES = [
  'src/base',
  'src/components',
  'src/utilities',
  'src/mixins',
  'src/compat',
];

/**
 * Pattern matching `@import` or `@use` statements that reference `foundation-sites`.
 * Covers both quoted and unquoted forms:
 *   @import 'foundation-sites/...'
 *   @import "foundation-sites/..."
 *   @use 'foundation-sites/...'
 *   @use "foundation-sites/..."
 */
const FOUNDATION_IMPORT_RE = /@(?:import|use)\s+['"].*foundation-sites/;

/**
 * Recursively collect all SCSS files under a given root.
 * Returns an array of { fullPath, relativePath } objects.
 */
function collectScssFiles(root) {
  const results = [];

  if (!fs.existsSync(root)) return results;

  const entries = fs.readdirSync(root, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name === 'node_modules') continue;

    const fullPath = path.join(root, entry.name);

    if (entry.isDirectory()) {
      results.push(...collectScssFiles(fullPath));
    } else if (entry.name.endsWith('.scss')) {
      results.push({ fullPath, relativePath: fullPath });
    }
  }

  return results;
}

/**
 * Collect all SCSS files from the non-vendor new directories.
 */
function getAllNonVendorScssFiles() {
  const allFiles = [];
  for (const dir of NON_VENDOR_DIRECTORIES) {
    allFiles.push(...collectScssFiles(dir));
  }
  return allFiles;
}

// ── Property Test ───────────────────────────────────────

describe('Feature: design-system-restructure, Property 5: Foundation imports isolated to vendor directory', () => {
  it('should have no foundation-sites imports in non-vendor SCSS files', () => {
    /**
     * Validates: Requirements 3.1
     */
    const scssFiles = getAllNonVendorScssFiles();

    // Ensure we actually found SCSS files to test
    expect(scssFiles.length).toBeGreaterThan(0);

    fc.assert(
      fc.property(
        fc.constantFrom(...scssFiles),
        ({ fullPath, relativePath }) => {
          const content = fs.readFileSync(fullPath, 'utf-8');
          const lines = content.split('\n');

          for (const line of lines) {
            expect(
              FOUNDATION_IMPORT_RE.test(line),
              `File "${relativePath}" contains a direct foundation-sites import: "${line.trim()}". ` +
              `Foundation imports should only exist in src/vendor/.`,
            ).toBe(false);
          }
        },
      ),
      { numRuns: Math.max(100, scssFiles.length * 5) },
    );
  });
});
