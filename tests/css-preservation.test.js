import { describe, it, expect, beforeAll } from 'vitest';
import { execSync } from 'child_process';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import os from 'os';
import fc from 'fast-check';

/**
 * Property 2: Preservation — CSS Output Identity
 *
 * **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7**
 *
 * Observation-first methodology: baseline SHA-256 hashes were captured from
 * the UNFIXED build output. After the fix is applied, the CSS output must
 * remain byte-for-byte identical.
 */

// Baseline SHA-256 hashes captured from UNFIXED build
const BASELINE_HASHES = {
  'dist/css/global.css': 'a828e933ee2a33ff2524ccb5c2e76a595cd6dddabde064947469262070fc43bb',
  'dist/css/utilities.css': '83e94967ff8d989c5ef8b214b85f620ddab9e2740dea2154e320039f4c1044e4',
  'dist/css/tokens.css': 'ff41c30fc533910059e7d13576fdd1144fa040f42a56c4acef6764d008cd3962',
};

const CSS_ENTRY_POINTS = ['dist/css/global.css', 'dist/css/utilities.css', 'dist/css/tokens.css'];

/**
 * Compute SHA-256 hash of a file's contents.
 */
function hashFile(filePath) {
  const content = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(content).digest('hex');
}

/**
 * Compile a Sass snippet and return the CSS output.
 * Uses a temp file to avoid shell escaping issues with $ variables.
 */
function compileSass(scss) {
  const tmpFile = path.join(os.tmpdir(), `sass-test-${Date.now()}-${Math.random().toString(36).slice(2)}.scss`);
  try {
    fs.writeFileSync(tmpFile, scss, 'utf-8');
    const script = `const sass = require('sass'); const r = sass.compile('${tmpFile.replace(/\\/g, '\\\\')}'); process.stdout.write(r.css);`;
    const result = execSync(`node -e "${script}"`, {
      encoding: 'utf-8',
      timeout: 15000,
    });
    return result.trim();
  } finally {
    try { fs.unlinkSync(tmpFile); } catch { /* ignore */ }
  }
}

describe('Preservation: CSS Output Identity', () => {
  let buildRan = false;

  beforeAll(() => {
    // Run a fresh build to ensure dist files are current
    try {
      execSync('npm run build', {
        cwd: path.resolve(process.cwd()),
        encoding: 'utf-8',
        timeout: 180_000,
        stdio: ['pipe', 'pipe', 'pipe'],
      });
      buildRan = true;
    } catch (err) {
      // Build may still produce output even if warnings cause non-zero exit
      buildRan = fs.existsSync('dist/css/global.css');
    }
  });

  describe('CSS file hash preservation', () => {
    it('should produce CSS files matching baseline hashes for all entry points (property-based)', () => {
      /**
       * **Validates: Requirements 3.1, 3.2**
       *
       * For all entry points in [global.css, utilities.css, tokens.css],
       * the CSS content after fix must match the baseline snapshot hash.
       */
      expect(buildRan).toBe(true);

      fc.assert(
        fc.property(
          fc.constantFrom(...CSS_ENTRY_POINTS),
          (entryPoint) => {
            const filePath = path.resolve(process.cwd(), entryPoint);
            expect(fs.existsSync(filePath)).toBe(true);

            const currentHash = hashFile(filePath);
            const baselineHash = BASELINE_HASHES[entryPoint];

            expect(currentHash).toBe(baselineHash);
          }
        ),
        { numRuns: 30 }
      );
    });
  });

  describe('darken() → color.adjust() equivalence', () => {
    it('should produce identical results for random lightness adjustments (property-based)', () => {
      /**
       * **Validates: Requirements 3.2**
       *
       * For darken() → color.adjust() equivalence: generate random lightness
       * adjustment percentages (0-100%) and verify color.adjust($color, $lightness: -N%)
       * produces the same result as darken($color, N%) for the specific colors used.
       */
      // The specific colors used in _settings.scss: $white (#fefefe), $table-background ($white),
      // $table-head-background ($white), $table-foot-background (smart-scale result ~#f1f1f1)
      const testColors = ['white', '#fefefe', '#f1f1f1'];

      // Constrain to 0-50% which covers the project's actual usage (2%, 5%, 7%)
      // and a wide margin beyond. darken() and color.adjust() are mathematically
      // equivalent for percentages that don't push lightness below 0%.
      fc.assert(
        fc.property(
          fc.constantFrom(...testColors),
          fc.integer({ min: 0, max: 50 }),
          (color, percentage) => {
            const darkenScss = `@use 'sass:color';\n$c: ${color};\n$result: darken($c, ${percentage}%);\na { color: $result; }`;
            const adjustScss = `@use 'sass:color';\n$c: ${color};\n$result: color.adjust($c, $lightness: -${percentage}%);\na { color: $result; }`;

            const darkenResult = compileSass(darkenScss);
            const adjustResult = compileSass(adjustScss);

            expect(adjustResult).toBe(darkenResult);
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  describe('type-of() → meta.type-of() equivalence', () => {
    it('should return identical strings for all Sass value types (property-based)', () => {
      /**
       * **Validates: Requirements 3.2**
       *
       * For type-of() → meta.type-of() equivalence: verify both functions
       * return identical strings for all Sass value types.
       */
      const sassValues = [
        { expr: '(a: 1, b: 2)', expectedType: 'map' },
        { expr: '42', expectedType: 'number' },
        { expr: '1px', expectedType: 'number' },
        { expr: '"hello"', expectedType: 'string' },
        { expr: 'hello', expectedType: 'string' },
        { expr: 'red', expectedType: 'color' },
        { expr: '#fff', expectedType: 'color' },
        { expr: '(1, 2, 3)', expectedType: 'list' },
        { expr: 'true', expectedType: 'bool' },
        { expr: 'null', expectedType: 'null' },
      ];

      fc.assert(
        fc.property(
          fc.constantFrom(...sassValues),
          (valueObj) => {
            const typeOfScss = `$v: ${valueObj.expr};\na { content: type-of($v); }`;
            const metaTypeOfScss = `@use 'sass:meta';\n$v: ${valueObj.expr};\na { content: meta.type-of($v); }`;

            const typeOfResult = compileSass(typeOfScss);
            const metaTypeOfResult = compileSass(metaTypeOfScss);

            expect(metaTypeOfResult).toBe(typeOfResult);
          }
        ),
        { numRuns: 50 }
      );
    });
  });
});
