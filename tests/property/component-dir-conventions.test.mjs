/**
 * Property 8: Component directory structure conventions
 *
 * For any component directory in `components/`, the directory name should
 * start with `sq-` and use kebab-case (e.g., `sq-tooltip/`, `sq-accordion/`).
 * This ensures consistency between directory names and CSS class names.
 *
 * Feature: design-system-restructure, Property 8: Component directory structure conventions
 * Validates: Requirements 5.1, 5.2, 8.3
 */
import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import fs from 'node:fs';
import path from 'node:path';

// ── Helpers ─────────────────────────────────────────────

const COMPONENTS_DIR = 'src/components';

/**
 * Scan `src/components/` for all component directories.
 * Returns an array of directory name strings.
 */
function getComponentDirectories() {
  const entries = fs.readdirSync(COMPONENTS_DIR, { withFileTypes: true });
  return entries
    .filter((e) => e.isDirectory())
    .map((e) => e.name);
}

// ── Property Test ───────────────────────────────────────

describe('Feature: design-system-restructure, Property 8: Component directory structure conventions', () => {
  it('should have all component directory names starting with sq- and using kebab-case', () => {
    /**
     * Validates: Requirements 5.1, 5.2, 8.3
     */
    const componentDirs = getComponentDirectories();

    // Ensure we actually found component directories to test
    expect(componentDirs.length).toBeGreaterThan(0);

    const SQ_KEBAB = /^sq-[a-z][a-z0-9]*(-[a-z0-9]+)*$/;

    fc.assert(
      fc.property(
        fc.constantFrom(...componentDirs),
        (dirName) => {
          expect(
            SQ_KEBAB.test(dirName),
            `Component directory "${path.join(COMPONENTS_DIR, dirName)}" does not match ` +
            `the expected "sq-{name}" kebab-case pattern.`,
          ).toBe(true);
        },
      ),
      { numRuns: Math.max(100, componentDirs.length * 10) },
    );
  });
});
