/**
 * Property 1: Token pipeline round-trip consistency
 *
 * For any valid token source file containing color token definitions,
 * running the Style Dictionary pipeline should produce SCSS variables,
 * CSS custom properties, and JSON output where every token's resolved
 * value matches the value defined in the source file.
 *
 * Feature: design-system-restructure, Property 1: Token pipeline round-trip consistency
 * Validates: Requirements 1.1, 1.2
 */
import { describe, it, expect, afterEach } from 'vitest';
import fc from 'fast-check';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import StyleDictionary from 'style-dictionary';

// ── Generators ──────────────────────────────────────────

/** Generate a valid hex color string (6-digit, uppercase). */
const hexColorArb = fc
  .tuple(
    fc.integer({ min: 0, max: 255 }),
    fc.integer({ min: 0, max: 255 }),
    fc.integer({ min: 0, max: 255 }),
  )
  .map(([r, g, b]) => {
    const hex = ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0');
    return `#${hex.toUpperCase()}`;
  });

/**
 * Generate a valid kebab-case token name segment.
 * Ensures names are valid CSS identifier parts: lowercase alpha start, then alphanumeric.
 */
const tokenNameArb = fc.stringMatching(/^[a-z][a-z0-9]{1,8}$/);

/**
 * Generate a subcategory name (e.g., "brand", "ui", "link").
 * Uses a separate generator to avoid collisions with token names.
 */
const subcategoryArb = fc
  .constantFrom('brand', 'ui', 'accent', 'state', 'theme', 'base', 'surface')

/**
 * Generate a map of 1-5 color tokens under a single subcategory.
 */
const colorTokenMapArb = fc
  .tuple(
    subcategoryArb,
    fc.uniqueArray(tokenNameArb, { minLength: 1, maxLength: 5 }),
    fc.array(hexColorArb, { minLength: 5, maxLength: 5 }),
  )
  .map(([subcategory, names, colors]) => {
    const tokens = {};
    for (let i = 0; i < names.length; i++) {
      tokens[names[i]] = { value: colors[i], type: 'color' };
    }
    return { subcategory, tokens };
  });

// ── Helpers ─────────────────────────────────────────────

/**
 * Build a token source JSON structure for color tokens.
 */
function buildTokenSource(subcategory, tokens) {
  return {
    color: {
      [subcategory]: tokens,
    },
  };
}

/**
 * Register the custom name transforms (same as production config).
 * We re-register them here so the test is self-contained.
 */
function registerTransforms() {
  try {
    StyleDictionary.registerTransform({
      name: 'name/scss-legacy',
      type: 'name',
      transform: (token) => {
        const p = token.path;
        if (p[0] === 'color') return p.join('--');
        return p.join('-');
      },
    });
  } catch (_) {
    // Already registered
  }

  try {
    StyleDictionary.registerTransform({
      name: 'name/css-sq-prefix',
      type: 'name',
      transform: (token) => {
        return `sq-${token.path.join('-')}`;
      },
    });
  } catch (_) {
    // Already registered
  }
}

/**
 * Create a temp directory, write token JSON, run Style Dictionary, return outputs.
 */
async function runPipeline(tokenSource) {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sd-roundtrip-'));
  const tokenDir = path.join(tmpDir, 'tokens', 'color');
  const scssDir = path.join(tmpDir, 'scss');
  const cssDir = path.join(tmpDir, 'css');
  const jsonDir = path.join(tmpDir, 'json');

  fs.mkdirSync(tokenDir, { recursive: true });
  fs.mkdirSync(scssDir, { recursive: true });
  fs.mkdirSync(cssDir, { recursive: true });
  fs.mkdirSync(jsonDir, { recursive: true });

  // Write token source
  fs.writeFileSync(
    path.join(tokenDir, 'test.json'),
    JSON.stringify(tokenSource, null, 2),
  );

  registerTransforms();

  // Build with Style Dictionary
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
      css: {
        transformGroup: 'css',
        transforms: ['attribute/cti', 'name/kebab', 'name/css-sq-prefix'],
        prefix: 'sq',
        buildPath: `${cssDir}/`,
        files: [
          {
            destination: '_custom-properties.scss',
            format: 'css/variables',
          },
        ],
      },
      json: {
        transformGroup: 'js',
        buildPath: `${jsonDir}/`,
        files: [
          {
            destination: 'tokens.json',
            format: 'json/flat',
          },
        ],
      },
    },
  });

  await sd.buildAllPlatforms();

  // Read outputs
  const scssContent = fs.readFileSync(
    path.join(scssDir, '_variables.scss'),
    'utf-8',
  );
  const cssContent = fs.readFileSync(
    path.join(cssDir, '_custom-properties.scss'),
    'utf-8',
  );
  const jsonContent = JSON.parse(
    fs.readFileSync(path.join(jsonDir, 'tokens.json'), 'utf-8'),
  );

  return { tmpDir, scssContent, cssContent, jsonContent };
}

/**
 * Parse SCSS variables from generated output.
 * Format: $name: value;
 * Returns Map<name, value>
 */
function parseScssVariables(scss) {
  const vars = new Map();
  const regex = /^\$([a-zA-Z0-9_-]+(?:--[a-zA-Z0-9_-]+)*):\s*(.+);$/gm;
  let match;
  while ((match = regex.exec(scss)) !== null) {
    vars.set(match[1], match[2].trim());
  }
  return vars;
}

/**
 * Parse CSS custom properties from generated output.
 * Format: --name: value;
 * Returns Map<name, value>
 */
function parseCssCustomProperties(css) {
  const vars = new Map();
  const regex = /^\s*--([a-zA-Z0-9_-]+):\s*(.+);$/gm;
  let match;
  while ((match = regex.exec(css)) !== null) {
    vars.set(match[1], match[2].trim());
  }
  return vars;
}

/**
 * Convert a token path to the expected PascalCase JSON key.
 * e.g., ['color', 'brand', 'warm-black'] → 'ColorBrandWarmBlack'
 */
function toPascalCaseKey(segments) {
  return segments
    .map((seg) =>
      seg
        .split('-')
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(''),
    )
    .join('');
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

describe('Feature: design-system-restructure, Property 1: Token pipeline round-trip consistency', () => {
  it('should preserve all color token values across SCSS, CSS, and JSON outputs', async () => {
    /**
     * Validates: Requirements 1.1, 1.2
     */
    await fc.assert(
      fc.asyncProperty(colorTokenMapArb, async ({ subcategory, tokens }) => {
        const tokenSource = buildTokenSource(subcategory, tokens);
        const { tmpDir, scssContent, cssContent, jsonContent } =
          await runPipeline(tokenSource);
        tmpDirs.push(tmpDir);

        const tokenEntries = Object.entries(tokens);

        for (const [name, tokenDef] of tokenEntries) {
          const expectedValue = tokenDef.value.toLowerCase();

          // ── SCSS check ──
          // Color tokens: color--{subcategory}--{name}
          const scssVarName = `color--${subcategory}--${name}`;
          const scssVars = parseScssVariables(scssContent);
          const scssValue = scssVars.get(scssVarName);
          expect(scssValue).toBeDefined();
          expect(scssValue.toLowerCase()).toBe(expectedValue);

          // ── CSS check ──
          // CSS custom properties: sq-color-{subcategory}-{name}
          const cssPropName = `sq-color-${subcategory}-${name}`;
          const cssVars = parseCssCustomProperties(cssContent);
          const cssValue = cssVars.get(cssPropName);
          expect(cssValue).toBeDefined();
          expect(cssValue.toLowerCase()).toBe(expectedValue);

          // ── JSON check ──
          // JSON flat: PascalCase key from path segments
          const jsonKey = toPascalCaseKey(['color', subcategory, name]);
          const jsonValue = jsonContent[jsonKey];
          expect(jsonValue).toBeDefined();
          expect(jsonValue.toLowerCase()).toBe(expectedValue);
        }
      }),
      { numRuns: 100 },
    );
  });
});
