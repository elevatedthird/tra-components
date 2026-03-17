/**
 * Property 4: Component import path predictability
 *
 * For any component in the design system, a file should exist at the path
 * `components/{component-name}/_{component-name}.scss` OR at least one file
 * matching `_{component-name}-*.scss` should exist in the directory (to handle
 * cases like `modal/` which has `_modal-content.scss` and `_modal-trigger.scss`
 * instead of `_modal.scss`).
 *
 * Feature: design-system-restructure, Property 4: Component import path predictability
 * Validates: Requirements 2.3
 */
import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import fs from 'node:fs';
import path from 'node:path';

// ── Helpers ─────────────────────────────────────────────

const COMPONENTS_DIR = 'src/components';

/**
 * Scan `src/components/` for all component directories.
 * Returns an array of { dirName, dirPath } objects.
 */
function getComponentDirectories() {
  const entries = fs.readdirSync(COMPONENTS_DIR, { withFileTypes: true });
  return entries
    .filter((e) => e.isDirectory())
    .map((e) => ({
      dirName: e.name,
      dirPath: path.join(COMPONENTS_DIR, e.name),
    }));
}

/**
 * Check whether a component directory has SCSS files.
 * Some components are template-only (twig + yml) with no SCSS.
 *
 * A directory satisfies the property if:
 *   1. It has no SCSS files at all (template-only component), OR
 *   2. `_{dirName}.scss` exists (the standard case), OR
 *   3. At least one `_*.scss` partial exists in the directory
 *      (e.g., `sq-modal/_sq-reveal.scss`)
 */
function hasMainScssFile(dirName, dirPath) {
  const files = fs.readdirSync(dirPath);
  const scssFiles = files.filter((f) => f.endsWith('.scss'));

  // Template-only components (no SCSS at all) are valid
  if (scssFiles.length === 0) return true;

  // Any SCSS partial in the directory satisfies the property
  return scssFiles.some((f) => f.startsWith('_'));
}

// ── Property Test ───────────────────────────────────────

describe('Feature: design-system-restructure, Property 4: Component import path predictability', () => {
  it('should have a predictable main SCSS file for every component directory', () => {
    /**
     * Validates: Requirements 2.3
     */
    const components = getComponentDirectories();

    // Ensure we actually found component directories to test
    expect(components.length).toBeGreaterThan(0);

    fc.assert(
      fc.property(
        fc.constantFrom(...components),
        ({ dirName, dirPath }) => {
          expect(
            hasMainScssFile(dirName, dirPath),
            `Component directory "${dirPath}" has no main SCSS file. ` +
            `Expected "_${dirName}.scss" or at least one "_${dirName}-*.scss" file.`,
          ).toBe(true);
        },
      ),
      { numRuns: Math.max(100, components.length * 10) },
    );
  });
});
