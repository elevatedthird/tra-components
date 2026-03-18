# Implementation Plan

- [x] 1. Write bug condition exploration test
  - **Property 1: Bug Condition** - Build Produces Deprecation and Asset Warnings
  - **CRITICAL**: This test MUST FAIL on unfixed code - failure confirms the bug exists
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: This test encodes the expected behavior - it will validate the fix when it passes after implementation
  - **GOAL**: Surface counterexamples that demonstrate the bug exists
  - **Scoped PBT Approach**: Scope the property to the concrete build configuration — run `npm run build` and parse stderr/stdout for warnings
  - Create a test file `tests/build-warnings.test.js` that:
    - Runs `npx webpack --config webpack.config.js --mode=production` via `child_process.execSync` and captures stderr+stdout
    - Asserts the build exits with code 0 (succeeds)
    - Asserts the combined output contains zero lines matching deprecation warning patterns (`WARNING`, `Deprecation`, `asset size limit`)
  - The test assertions match Expected Behavior Properties from design: zero warnings, successful build
  - Run test on UNFIXED code
  - **EXPECTED OUTCOME**: Test FAILS because the unfixed build produces 435 warnings (this proves the bug exists)
  - Document counterexamples: legacy JS API warnings (3), @import deprecation (~400+), global built-in warnings from `_grid.scss` (2), `darken()` warnings from `_settings.scss` (4), asset size warnings (3)
  - Mark task complete when test is written, run, and failure is documented
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7_

- [x] 2. Write preservation property tests (BEFORE implementing fix)
  - **Property 2: Preservation** - CSS Output Identity
  - **IMPORTANT**: Follow observation-first methodology
  - Create a test file `tests/css-preservation.test.js` that:
    - Runs `npm run build` on the UNFIXED code and captures CSS output snapshots
    - Reads the generated CSS files: `dist/css/global.css`, `dist/css/utilities.css`, `dist/css/tokens.css`
    - Stores content hashes (SHA-256) of each CSS file as baseline snapshots in a `.snapshots` directory or inline
  - Observe: Run build on unfixed code, record SHA-256 hashes of all CSS output files
  - Write property-based test using `fast-check`:
    - For all entry points in `[global.css, utilities.css, tokens.css]`, assert the CSS content after fix matches the baseline snapshot hash
    - For `darken()` → `color.adjust()` equivalence: generate random lightness adjustment percentages (0-100%) and verify `color.adjust($color, $lightness: -N%)` produces the same result as `darken($color, N%)` for the specific colors used (`$white`, `$table-background`, `$table-head-background`, `$table-foot-background`)
    - For `type-of()` → `meta.type-of()` equivalence: verify both functions return identical strings for all Sass value types (map, number, string, color, list)
  - Verify tests PASS on UNFIXED code (baseline behavior is captured correctly)
  - **EXPECTED OUTCOME**: Tests PASS (this confirms baseline behavior to preserve)
  - Mark task complete when tests are written, run, and passing on unfixed code
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7_

- [x] 3. Fix for npm build deprecation and asset warnings

  - [x] 3.1 Update webpack.config.js sass-loader configuration
    - Add `api: 'modern-compiler'` to the sass-loader `options` object to switch from deprecated JS API to modern compiler API (eliminates 3 legacy JS API warnings)
    - Add `silenceDeprecations: ['import', 'global-builtin']` to the `sassOptions` object to silence unfixable @import deprecation warnings (~400+) and Foundation Sites global built-in warnings
    - Add `performance: { hints: false }` at the top level of the webpack config to suppress 3 asset size warnings for `utilities.css`
    - _Bug_Condition: isBugCondition(input) where input.sassLoaderOptions.api != 'modern-compiler' OR input.sassOptions lacks silenceDeprecations OR input.webpackConfig.performance != { hints: false }_
    - _Expected_Behavior: Zero legacy JS API warnings, zero @import warnings, zero global-builtin warnings from Foundation, zero asset size warnings_
    - _Preservation: All CSS output files must remain identical — configuration changes only affect warning output, not compiled CSS_
    - _Requirements: 2.1, 2.2, 2.3, 2.6, 2.7, 3.1, 3.2, 3.5_

  - [x] 3.2 Fix deprecated type-of() calls in src/utilities/_grid.scss
    - Add `@use 'sass:meta'` after the existing `@use 'sass:math'` at the top of the file
    - Replace `type-of($size)` with `meta.type-of($size)` at line 168 (bottom-margins loop)
    - Replace `type-of($size)` with `meta.type-of($size)` at line 185 (top-margins loop)
    - _Bug_Condition: isBugCondition(input) where input.sourceFiles CONTAIN calls to global type-of()_
    - _Expected_Behavior: Zero global built-in deprecation warnings from _grid.scss_
    - _Preservation: meta.type-of() returns identical values to type-of() for all Sass value types — CSS output unchanged_
    - _Requirements: 2.4, 3.1, 3.2_

  - [x] 3.3 Fix deprecated darken() calls in src/vendor/foundation/_settings.scss
    - Add `@use 'sass:color'` at the top of the file
    - Replace `darken($table-background, $table-hover-scale)` with `color.adjust($table-background, $lightness: -$table-hover-scale)` (line 821)
    - Replace `darken($table-background, $table-color-scale + $table-hover-scale)` with `color.adjust($table-background, $lightness: -($table-color-scale + $table-hover-scale))` (line 822)
    - Replace `darken($table-head-background, $table-hover-scale)` with `color.adjust($table-head-background, $lightness: -$table-hover-scale)` (line 827)
    - Replace `darken($table-foot-background, $table-hover-scale)` with `color.adjust($table-foot-background, $lightness: -$table-hover-scale)` (line 829)
    - _Bug_Condition: isBugCondition(input) where input.sourceFiles CONTAIN calls to global darken()_
    - _Expected_Behavior: Zero deprecated color function warnings from _settings.scss_
    - _Preservation: color.adjust($color, $lightness: -N%) produces identical color values to darken($color, N%) — CSS output unchanged_
    - _Requirements: 2.5, 3.1, 3.2_

  - [x] 3.4 Verify bug condition exploration test now passes
    - **Property 1: Expected Behavior** - Build Produces Zero Warnings
    - **IMPORTANT**: Re-run the SAME test from task 1 - do NOT write a new test
    - The test from task 1 encodes the expected behavior (zero warnings, successful build)
    - When this test passes, it confirms the expected behavior is satisfied
    - Run bug condition exploration test from step 1
    - **EXPECTED OUTCOME**: Test PASSES (confirms all 435 warnings are eliminated)
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7_

  - [x] 3.5 Verify preservation tests still pass
    - **Property 2: Preservation** - CSS Output Identity
    - **IMPORTANT**: Re-run the SAME tests from task 2 - do NOT write new tests
    - Run preservation property tests from step 2
    - **EXPECTED OUTCOME**: Tests PASS (confirms CSS output is identical before and after fix)
    - Confirm all tests still pass after fix (no regressions)

- [x] 4. Checkpoint - Ensure all tests pass
  - Run full test suite with `npm test` to verify all tests pass
  - Run `npm run build` manually to confirm zero warnings in console output
  - Verify all expected output files exist in `dist/` and `src/components/`
  - Ensure all tests pass, ask the user if questions arise
