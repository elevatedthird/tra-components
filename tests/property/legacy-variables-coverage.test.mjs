/**
 * Property 10: Legacy variables covered by generated output
 *
 * For any SCSS variable name defined in the current `src/00-config/settings/*.scss`
 * files, the generated `src/generated/_variables.scss` should contain a variable
 * with the same name, or the Backward Compatibility Layer (`src/compat/_legacy-vars.scss`)
 * should contain an explicit mapping.
 *
 * Feature: design-system-restructure, Property 10: Legacy variables covered by generated output
 * Validates: Requirements 7.2
 */
import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import fs from 'node:fs';
import path from 'node:path';

// ── Helpers ─────────────────────────────────────────────

const SETTINGS_DIR = 'src/00-config/settings';
const GENERATED_VARIABLES_FILE = 'src/generated/_variables.scss';
const LEGACY_VARS_FILE = 'src/compat/_legacy-vars.scss';

/**
 * Regex to match top-level SCSS variable declarations.
 * Matches lines that start with `$variable-name:` where the name begins with
 * a letter or underscore (excludes private vars like `$-zf-zero-breakpoint`).
 */
const VARIABLE_DECLARATION_RE = /^\$([a-zA-Z_][\w-]*)\s*:/;

/**
 * Extract all top-level SCSS variable names from a file.
 * Only matches lines where `$` is at the very start (top-level declarations).
 */
function extractTopLevelVariables(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const variables = [];

  for (const line of lines) {
    const match = line.match(VARIABLE_DECLARATION_RE);
    if (match) {
      variables.push(match[1]);
    }
  }

  return variables;
}

/**
 * Read all SCSS files in the settings directory and extract variable names.
 */
function getAllLegacyVariables() {
  const files = fs.readdirSync(SETTINGS_DIR)
    .filter(f => f.endsWith('.scss'))
    .map(f => path.join(SETTINGS_DIR, f));

  const allVars = [];
  for (const file of files) {
    const vars = extractTopLevelVariables(file);
    for (const v of vars) {
      allVars.push({ name: v, file: path.basename(file) });
    }
  }

  return allVars;
}

/**
 * Extract all variable names defined in a given SCSS file (top-level).
 */
function extractVariableNames(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const names = new Set();

  for (const line of lines) {
    const match = line.match(VARIABLE_DECLARATION_RE);
    if (match) {
      names.add(match[1]);
    }
  }

  return names;
}

// ── Property Test ───────────────────────────────────────

describe('Feature: design-system-restructure, Property 10: Legacy variables covered by generated output', () => {
  it('should have every legacy variable covered by generated output or compat layer', () => {
    /**
     * Validates: Requirements 7.2
     */
    const legacyVariables = getAllLegacyVariables();
    const generatedVars = extractVariableNames(GENERATED_VARIABLES_FILE);
    const compatVars = extractVariableNames(LEGACY_VARS_FILE);

    // Ensure we actually found legacy variables to test
    expect(legacyVariables.length).toBeGreaterThan(0);

    fc.assert(
      fc.property(
        fc.constantFrom(...legacyVariables),
        ({ name, file }) => {
          const inGenerated = generatedVars.has(name);
          const inCompat = compatVars.has(name);

          expect(
            inGenerated || inCompat,
            `Legacy variable "$${name}" from "${file}" is not found in ` +
            `"${GENERATED_VARIABLES_FILE}" or "${LEGACY_VARS_FILE}". ` +
            `All legacy variables must be covered by the generated output or the compatibility layer.`,
          ).toBe(true);
        },
      ),
      { numRuns: Math.max(100, legacyVariables.length * 5) },
    );
  });
});
