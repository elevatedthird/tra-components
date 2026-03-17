/**
 * Property 9: Invalid token files produce build errors
 *
 * For any malformed JSON token file (missing required `value` field, invalid
 * JSON syntax, or insufficient nesting), the Token Pipeline validation step
 * should fail with a descriptive error message and a non-zero exit code.
 *
 * We generate invalid token files, write them to a temp directory, run
 * `scripts/validate-tokens.mjs` against them, and verify the validator
 * rejects them with a non-zero exit code and descriptive error output.
 *
 * Feature: design-system-restructure, Property 9: Invalid token files produce build errors
 * Validates: Requirements 6.4
 */
import { describe, it, expect, afterEach } from 'vitest';
import fc from 'fast-check';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '..', '..');
const VALIDATE_SCRIPT = path.join(PROJECT_ROOT, 'scripts', 'validate-tokens.mjs');

// ── Generators ──────────────────────────────────────────

/** Generate a valid kebab-case token name. */
const tokenNameArb = fc.stringMatching(/^[a-z][a-z0-9]{1,8}$/);

/** Generate a valid hex color value. */
const hexColorArb = fc
  .tuple(
    fc.integer({ min: 0, max: 255 }),
    fc.integer({ min: 0, max: 255 }),
    fc.integer({ min: 0, max: 255 }),
  )
  .map(([r, g, b]) => `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`);

/**
 * Generator: Token object missing the required `value` field.
 * Produces a valid JSON structure but leaf tokens lack `value`.
 */
const missingValueArb = fc
  .tuple(
    fc.constantFrom('color', 'spacing', 'typography'),
    fc.constantFrom('brand', 'ui', 'scale', 'base'),
    tokenNameArb,
  )
  .map(([category, subcategory, name]) => ({
    kind: 'missing-value',
    content: {
      [category]: {
        [subcategory]: {
          [name]: { type: 'color', description: 'A token without a value' },
        },
      },
    },
  }));

/**
 * Generator: Invalid JSON syntax strings.
 * Produces strings that are not parseable as valid JSON.
 */
const invalidJsonArb = fc
  .constantFrom(
    '{ "color": { "brand": { "red": { "value": "#FF0000" } }',       // missing closing brace
    '{ color: "brand" }',                                              // unquoted key
    '{ "color": undefined }',                                          // undefined value
    '',                                                                 // empty string
    '{"trailing": "comma",}',                                          // trailing comma
    'not json at all',                                                  // plain text
  )
  .map((raw) => ({
    kind: 'invalid-json',
    rawContent: raw,
  }));

/**
 * Generator: Insufficient nesting (leaf token at depth < 2).
 * Token is placed directly at the top level, violating the 2-level minimum.
 */
const insufficientNestingArb = fc
  .tuple(tokenNameArb, hexColorArb)
  .map(([name, color]) => ({
    kind: 'insufficient-nesting',
    content: {
      [name]: { value: color, type: 'color' },
    },
  }));

/** Combined generator for all invalid token file types. */
const invalidTokenArb = fc.oneof(
  missingValueArb,
  invalidJsonArb,
  insufficientNestingArb,
);

// ── Helpers ─────────────────────────────────────────────

/**
 * Write an invalid token file to a temp directory and run the validator.
 * Returns { exitCode, stderr }.
 */
function runValidatorWithInvalidToken(invalidToken) {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sd-invalid-'));
  const tokenDir = path.join(tmpDir, 'tokens', 'color');
  fs.mkdirSync(tokenDir, { recursive: true });

  const tokenFile = path.join(tokenDir, 'test.json');

  if (invalidToken.kind === 'invalid-json') {
    fs.writeFileSync(tokenFile, invalidToken.rawContent, 'utf-8');
  } else {
    fs.writeFileSync(tokenFile, JSON.stringify(invalidToken.content, null, 2), 'utf-8');
  }

  let exitCode = 0;
  let stderr = '';

  try {
    execFileSync('node', [VALIDATE_SCRIPT], {
      cwd: tmpDir,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
      timeout: 10000,
    });
    exitCode = 0;
  } catch (err) {
    exitCode = err.status ?? 1;
    stderr = err.stderr ?? '';
  }

  // Cleanup
  try {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  } catch (_) {
    // best-effort cleanup
  }

  return { exitCode, stderr };
}

// ── Property Test ───────────────────────────────────────

describe('Feature: design-system-restructure, Property 9: Invalid token files produce build errors', () => {
  it('should reject invalid token files with non-zero exit code and descriptive error', () => {
    /**
     * Validates: Requirements 6.4
     */
    fc.assert(
      fc.property(invalidTokenArb, (invalidToken) => {
        const { exitCode, stderr } = runValidatorWithInvalidToken(invalidToken);

        // Validator must exit with non-zero code
        expect(exitCode).not.toBe(0);

        // Validator must produce descriptive error output
        expect(stderr.length).toBeGreaterThan(0);
      }),
      { numRuns: 100 },
    );
  });
});
