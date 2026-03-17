/**
 * Property 2: Generated SCSS variables preserve legacy names
 *
 * For any design token defined in a Token Source File, the generated SCSS
 * variable name should match the existing legacy variable name used in the
 * current codebase (preserving the `--` separator convention for colors
 * and existing naming for spacing/typography).
 *
 * Feature: design-system-restructure, Property 2: Generated SCSS variables preserve legacy names
 * Validates: Requirements 1.4, 7.2
 */
import { describe, it, expect, afterEach } from 'vitest';
import fc from 'fast-check';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import StyleDictionary from 'style-dictionary';

// ── Generators ──────────────────────────────────────────

/** Kebab-case name segment: lowercase alpha start, then alphanumeric/hyphens. */
const nameSegmentArb = fc.stringMatching(/^[a-z][a-z0-9]{1,8}$/);

/** Subcategory for color tokens. */
const colorSubcategoryArb = fc.constantFrom(
  'brand', 'vibrant', 'contrasting', 'neutral', 'ui', 'link', 'form',
);

/** Generate a valid hex color string. */
const hexColorArb = fc
  .tuple(
    fc.integer({ min: 0, max: 255 }),
    fc.integer({ min: 0, max: 255 }),
    fc.integer({ min: 0, max: 255 }),
  )
  .map(([r, g, b]) => `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0').toUpperCase()}`);

/** Spacing scale number (1-30). */
const spacingNumberArb = fc.integer({ min: 1, max: 30 }).map(String);

/** Typography group names. */
const fontSizeGroupArb = fc.constantFrom('display', 'heading', 'body', 'label');

/** Size variant names. */
const sizeVariantArb = fc.constantFrom('xl', 'lg', 'md', 'sm', 'xs');

/** Font family names. */
const fontFamilyNameArb = fc.constantFrom('body', 'heading', 'monospace', 'icon');

/** Font weight names. */
const fontWeightNameArb = fc.constantFrom('light', 'normal', 'medium', 'bold');

/** Shadow elevation names. */
const shadowNameArb = fc.constantFrom('primary', 'default', 'subtle', 'strong');

/** Breakpoint screen names. */
const breakpointNameArb = fc.constantFrom('small', 'medium', 'large', 'xlarge');

// ── Token category generators ───────────────────────────

/**
 * Each generator produces:
 *   { tokenSource, expectedVarNames }
 * where expectedVarNames is an array of the SCSS variable names (without $)
 * that should appear in the generated output.
 */

const colorTokenArb = fc
  .tuple(colorSubcategoryArb, fc.uniqueArray(nameSegmentArb, { minLength: 1, maxLength: 3 }), fc.array(hexColorArb, { minLength: 3, maxLength: 3 }))
  .map(([sub, names, colors]) => {
    const tokens = {};
    const expectedVarNames = [];
    for (let i = 0; i < names.length; i++) {
      tokens[names[i]] = { value: colors[i], type: 'color' };
      // Legacy: color--{subcategory}--{name}
      expectedVarNames.push(`color--${sub}--${names[i]}`);
    }
    return {
      tokenSource: { color: { [sub]: tokens } },
      expectedVarNames,
    };
  });

const spacingTokenArb = fc
  .uniqueArray(spacingNumberArb, { minLength: 1, maxLength: 5 })
  .map((nums) => {
    const tokens = {};
    const expectedVarNames = [];
    for (const n of nums) {
      tokens[n] = { value: `${Number(n) * 0.25}rem`, type: 'dimension' };
      // Legacy: spacing-{N}
      expectedVarNames.push(`spacing-${n}`);
    }
    return {
      tokenSource: { spacing: { scale: tokens } },
      expectedVarNames,
    };
  });

const fontSizeTokenArb = fc
  .tuple(fontSizeGroupArb, fc.uniqueArray(sizeVariantArb, { minLength: 1, maxLength: 3 }))
  .map(([group, sizes]) => {
    const tokens = {};
    const expectedVarNames = [];
    for (const size of sizes) {
      tokens[size] = { value: '16px', type: 'dimension' };
      // Legacy: {group}-{size}-font-size
      expectedVarNames.push(`${group}-${size}-font-size`);
    }
    return {
      tokenSource: { typography: { 'font-size': { [group]: tokens } } },
      expectedVarNames,
    };
  });

const fontFamilyTokenArb = fc
  .uniqueArray(fontFamilyNameArb, { minLength: 1, maxLength: 3 })
  .map((names) => {
    const tokens = {};
    const expectedVarNames = [];
    for (const name of names) {
      tokens[name] = { value: '"Arial", sans-serif', type: 'fontFamily' };
      // Legacy: {name}-font-family
      expectedVarNames.push(`${name}-font-family`);
    }
    return {
      tokenSource: { typography: { 'font-family': tokens } },
      expectedVarNames,
    };
  });

const fontWeightTokenArb = fc
  .uniqueArray(fontWeightNameArb, { minLength: 1, maxLength: 3 })
  .map((names) => {
    const tokens = {};
    const expectedVarNames = [];
    for (const name of names) {
      tokens[name] = { value: '400', type: 'fontWeight' };
      // Legacy: font-weight-{name}
      expectedVarNames.push(`font-weight-${name}`);
    }
    return {
      tokenSource: { typography: { 'font-weight': tokens } },
      expectedVarNames,
    };
  });

const lineHeightTokenArb = fc
  .tuple(fontSizeGroupArb, fc.uniqueArray(sizeVariantArb, { minLength: 1, maxLength: 3 }))
  .map(([group, sizes]) => {
    const tokens = {};
    const expectedVarNames = [];
    for (const size of sizes) {
      tokens[size] = { value: '150%', type: 'number' };
      // Legacy: {group}-{size}-line-height
      expectedVarNames.push(`${group}-${size}-line-height`);
    }
    return {
      tokenSource: { typography: { 'line-height': { [group]: tokens } } },
      expectedVarNames,
    };
  });

const shadowTokenArb = fc
  .uniqueArray(shadowNameArb, { minLength: 1, maxLength: 2 })
  .map((names) => {
    const tokens = {};
    const expectedVarNames = [];
    for (const name of names) {
      tokens[name] = { value: '0 6px 20px rgba(0,0,0,0.3)', type: 'shadow' };
      // Legacy: box-shadow-{name}
      expectedVarNames.push(`box-shadow-${name}`);
    }
    return {
      tokenSource: { shadow: { elevation: tokens } },
      expectedVarNames,
    };
  });

const breakpointTokenArb = fc
  .uniqueArray(breakpointNameArb, { minLength: 1, maxLength: 3 })
  .map((names) => {
    const tokens = {};
    const expectedVarNames = [];
    for (const name of names) {
      tokens[name] = { value: '960px', type: 'dimension' };
      // Legacy: breakpoint-{name}
      expectedVarNames.push(`breakpoint-${name}`);
    }
    return {
      tokenSource: { breakpoint: { screen: tokens } },
      expectedVarNames,
    };
  });

/** Combined arbitrary that picks one token category per run. */
const tokenCategoryArb = fc.oneof(
  colorTokenArb,
  spacingTokenArb,
  fontSizeTokenArb,
  fontFamilyTokenArb,
  fontWeightTokenArb,
  lineHeightTokenArb,
  shadowTokenArb,
  breakpointTokenArb,
);

// ── Helpers ─────────────────────────────────────────────

/** Register the custom SCSS legacy name transform (same as production config). */
function registerTransforms() {
  try {
    StyleDictionary.registerTransform({
      name: 'name/scss-legacy',
      type: 'name',
      transform: (token) => {
        const p = token.path;
        const category = p[0];

        if (category === 'color') return p.join('--');

        if (category === 'spacing') return `spacing-${p[p.length - 1]}`;

        if (category === 'typography') {
          const sub = p[1];
          if (sub === 'font-size') return `${p.slice(2).join('-')}-font-size`;
          if (sub === 'font-family') return `${p[2]}-font-family`;
          if (sub === 'font-weight') return `font-weight-${p[2]}`;
          if (sub === 'line-height') return `${p.slice(2).join('-')}-line-height`;
        }

        if (category === 'shadow') return `box-shadow-${p[p.length - 1]}`;
        if (category === 'breakpoint') return `breakpoint-${p[p.length - 1]}`;

        return p.join('-');
      },
    });
  } catch (_) {
    // Already registered
  }
}

/**
 * Run Style Dictionary on a token source and return the generated SCSS content.
 */
async function runScssGeneration(tokenSource) {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sd-legacy-names-'));
  const tokenDir = path.join(tmpDir, 'tokens');
  const scssDir = path.join(tmpDir, 'scss');

  fs.mkdirSync(tokenDir, { recursive: true });
  fs.mkdirSync(scssDir, { recursive: true });

  fs.writeFileSync(
    path.join(tokenDir, 'test.json'),
    JSON.stringify(tokenSource, null, 2),
  );

  registerTransforms();

  const sd = new StyleDictionary({
    source: [path.join(tmpDir, 'tokens/**/*.json')],
    platforms: {
      scss: {
        transformGroup: 'scss',
        transforms: ['attribute/cti', 'name/kebab', 'name/scss-legacy'],
        buildPath: `${scssDir}/`,
        files: [
          {
            destination: '_variables.scss',
            format: 'scss/variables',
          },
        ],
      },
    },
  });

  await sd.buildAllPlatforms();

  const scssContent = fs.readFileSync(
    path.join(scssDir, '_variables.scss'),
    'utf-8',
  );

  return { tmpDir, scssContent };
}

/**
 * Parse SCSS variable names from generated output.
 * Returns a Set of variable names (without the $ prefix).
 */
function parseScssVarNames(scss) {
  const names = new Set();
  const regex = /^\$([a-zA-Z0-9_-]+(?:--[a-zA-Z0-9_-]+)*):\s*.+;$/gm;
  let match;
  while ((match = regex.exec(scss)) !== null) {
    names.add(match[1]);
  }
  return names;
}

// ── Cleanup tracking ────────────────────────────────────

const tmpDirs = [];

afterEach(() => {
  for (const dir of tmpDirs) {
    try {
      fs.rmSync(dir, { recursive: true, force: true });
    } catch (_) {
      // best-effort cleanup
    }
  }
  tmpDirs.length = 0;
});

// ── Property Test ───────────────────────────────────────

describe('Feature: design-system-restructure, Property 2: Generated SCSS variables preserve legacy names', () => {
  it('should generate SCSS variable names matching legacy conventions for all token categories', async () => {
    /**
     * Validates: Requirements 1.4, 7.2
     */
    await fc.assert(
      fc.asyncProperty(tokenCategoryArb, async ({ tokenSource, expectedVarNames }) => {
        const { tmpDir, scssContent } = await runScssGeneration(tokenSource);
        tmpDirs.push(tmpDir);

        const generatedNames = parseScssVarNames(scssContent);

        for (const expectedName of expectedVarNames) {
          expect(
            generatedNames.has(expectedName),
            `Expected SCSS variable $${expectedName} to exist in generated output. Found: ${[...generatedNames].map(n => `$${n}`).join(', ')}`,
          ).toBe(true);
        }
      }),
      { numRuns: 100 },
    );
  });
});
