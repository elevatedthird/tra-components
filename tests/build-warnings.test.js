import { describe, it, expect, beforeAll } from 'vitest';
import { execSync } from 'child_process';
import path from 'path';

/**
 * Bug Condition Exploration Test — Property 1: Build Produces Zero Warnings
 *
 * **Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7**
 *
 * This test encodes the EXPECTED behavior: a clean build with zero warnings.
 * On UNFIXED code it will FAIL, confirming the bug exists.
 * After the fix is applied it should PASS, confirming the bug is resolved.
 */
describe('Bug Condition: Build produces zero warnings', () => {
  let buildOutput;
  let buildExitCode;

  // Run the webpack production build once and capture all output (stdout + stderr merged)
  beforeAll(() => {
    try {
      // Merge stderr into stdout so we capture all warnings in one stream
      const result = execSync(
        'npx webpack --config webpack.config.js --mode=production 2>&1',
        {
          cwd: path.resolve(process.cwd()),
          encoding: 'utf-8',
          timeout: 120_000,
        }
      );
      buildOutput = result;
      buildExitCode = 0;
    } catch (err) {
      // execSync throws on non-zero exit code
      buildOutput = err.stdout || err.message || '';
      buildExitCode = err.status ?? 1;
    }
  });

  it('should complete the build successfully (exit code 0)', () => {
    expect(buildExitCode).toBe(0);
  });

  it('should produce zero deprecation or asset-size warnings in build output', () => {
    const lines = buildOutput.split('\n');

    // Patterns that indicate warnings in the webpack / sass build output
    const warningPatterns = [
      /WARNING/i,
      /Deprecation/i,
      /asset size limit/i,
    ];

    const warningLines = lines.filter((line) =>
      warningPatterns.some((pattern) => pattern.test(line))
    );

    expect(
      warningLines,
      `Expected zero warning lines but found ${warningLines.length}:\n${warningLines.slice(0, 20).join('\n')}${warningLines.length > 20 ? '\n... (truncated)' : ''}`
    ).toHaveLength(0);
  });
});
