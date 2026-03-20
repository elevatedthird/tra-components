/**
 * Property 6: Foundation mixin calls wrapped in adapter
 *
 * For any SCSS file outside the `vendor/foundation/` adapter, the file should
 * not contain direct calls to Foundation-namespaced mixins (e.g.,
 * `foundation-xy-grid-classes`, `foundation-flex-classes`, etc.).
 *
 * All Foundation mixin usage must go through the Sequoia-namespaced sq-*
 * wrappers defined in `src/vendor/foundation/_adapter.scss`.
 *
 * Feature: design-system-restructure, Property 6: Foundation mixin calls wrapped in adapter
 * Validates: Requirements 3.2
 */
import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import fs from 'node:fs';
import path from 'node:path';

// ── Helpers ─────────────────────────────────────────────

/** The new directories to scan (excludes vendor/foundation adapter). */
const DIRECTORIES_TO_SCAN = [
  'src/base',
  'src/components',
  'src/utilities',
  'src/mixins',
  'src/compat',
];

/**
 * Pattern matching direct Foundation mixin calls via `@include foundation-*`.
 * This catches all Foundation-namespaced mixins such as:
 *   @include foundation-global-styles
 *   @include foundation-xy-grid-classes
 *   @include foundation-flex-classes
 *   @include foundation-visibility-classes
 *   @include foundation-text-alignment
 *   @include foundation-typography-base
 *   @include foundation-typography-helpers
 *   @include foundation-prototype-text-transformation
 *   @include foundation-prototype-text-decoration
 *   @include foundation-prototype-border-none
 *   @include foundation-prototype-sizing
 *   @include foundation-prototype-display
 *   @include foundation-responsive-embed
 *   @include foundation-accordion
 *   @include foundation-reveal
 */
const FOUNDATION_MIXIN_RE = /@include\s+foundation-/;

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
 * Collect all SCSS files from the non-adapter directories.
 */
function getAllNonAdapterScssFiles() {
  const allFiles = [];
  for (const dir of DIRECTORIES_TO_SCAN) {
    allFiles.push(...collectScssFiles(dir));
  }
  return allFiles;
}

// ── Property Test ───────────────────────────────────────

describe('Feature: design-system-restructure, Property 6: Foundation mixin calls wrapped in adapter', () => {
  it('should have no direct Foundation mixin calls in non-adapter SCSS files', () => {
    /**
     * Validates: Requirements 3.2
     */
    const scssFiles = getAllNonAdapterScssFiles();

    // Ensure we actually found SCSS files to test
    expect(scssFiles.length).toBeGreaterThan(0);

    fc.assert(
      fc.property(
        fc.constantFrom(...scssFiles),
        ({ fullPath, relativePath }) => {
          const content = fs.readFileSync(fullPath, 'utf-8');
          const lines = content.split('\n');

          for (const line of lines) {
            // Skip comment lines
            if (line.trim().startsWith('//')) continue;

            expect(
              FOUNDATION_MIXIN_RE.test(line),
              `File "${relativePath}" contains a direct Foundation mixin call: "${line.trim()}". ` +
              `Foundation mixins should only be called from src/vendor/foundation/_adapter.scss. ` +
              `Use the sq-* wrapper mixins instead.`,
            ).toBe(false);
          }
        },
      ),
      { numRuns: Math.max(100, scssFiles.length * 5) },
    );
  });
});
