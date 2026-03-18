# NPM Warning Fixes Bugfix Design

## Overview

The `npm run build` command produces 435 warnings across 5 categories that obscure real errors. The fix uses a two-pronged strategy: (1) targeted source code fixes for project-owned deprecations (`type-of()` in `_grid.scss`, `darken()` in `_settings.scss`), (2) configuration changes in `webpack.config.js` to switch to the modern Sass compiler API, silence unfixable deprecations from Foundation Sites and `@import` rules, and suppress asset size warnings. A full `@import` → `@use`/`@forward` migration is explicitly avoided because it would require restructuring the entire SCSS architecture, changing variable scoping, and risks breaking CSS output.

## Glossary

- **Bug_Condition (C)**: The condition that triggers warnings — running `npm run build` with the current webpack/sass-loader configuration and deprecated Sass function calls in source files
- **Property (P)**: The desired behavior — a clean build with zero warnings while producing identical CSS output
- **Preservation**: The existing CSS output (selectors, properties, values) across all entry points and component builds must remain byte-for-byte identical
- **sass-loader**: The webpack loader (`sass-loader@13.2.0`) that compiles SCSS to CSS; currently defaults to the deprecated JS API
- **silenceDeprecations**: A sass-loader option that suppresses specific Sass deprecation categories for warnings that cannot be fixed at source (e.g., Foundation Sites internals, `@import` rules)
- **additionalData**: The sass-loader option that prepends `@import "./src/_index.scss"` to every SCSS file before compilation, providing global access to variables and mixins

## Bug Details

### Bug Condition

The bug manifests when `npm run build` is executed. The build succeeds but emits 435 warnings across 5 categories: legacy JS API (3), `@import` deprecation (~400+), global built-in functions (~25), deprecated color functions (4), and asset size limits (3). These warnings originate from three sources: sass-loader configuration defaults, project source SCSS files, and third-party Foundation Sites code in `node_modules`.

**Formal Specification:**
```
FUNCTION isBugCondition(input)
  INPUT: input of type BuildConfiguration
  OUTPUT: boolean

  RETURN input.sassLoaderOptions.api != 'modern-compiler'
         OR input.scssFiles CONTAIN '@import' statements
         OR input.sourceFiles CONTAIN calls to global type-of()
         OR input.sourceFiles CONTAIN calls to global darken()
         OR input.foundationDeps CONTAIN deprecated built-in functions
         OR input.webpackConfig.performance != { hints: false }
END FUNCTION
```

### Examples

- Running `npm run build` → 3 "Legacy JS API" warnings because `sass-loader@13.2.0` defaults to the deprecated Dart Sass JS API instead of `api: 'modern-compiler'`
- Compiling any SCSS entry point → ~400+ `@import` deprecation warnings because every `@import` statement (in `_index.scss`, `_framework.scss`, `_app.scss`, component files, etc.) triggers a Sass deprecation notice
- Compiling `src/utilities/_grid.scss` → 2 warnings at lines 168 and 185 for `type-of($size) == 'map'` which should use `meta.type-of()`
- Compiling `src/vendor/foundation/_settings.scss` → 4 warnings at lines 821, 822, 827, 829 for `darken()` calls which should use `color.adjust()`
- Build produces `utilities.css` at 512 KiB → 3 asset size warnings exceeding the 244 KiB default limit

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- All CSS output files (`dist/css/global.css`, `dist/css/utilities.css`, `dist/css/tokens.css`, and all component CSS files) must be functionally identical before and after the fix
- The Foundation Sites adapter pattern (`sq-*` wrappers in `_adapter.scss`) must continue to produce the same CSS output
- Nested `@import` inside selector rules in `src/base/_app.scss` (`.layout-container, .reveal {}`) and `src/utilities.scss` must continue to scope styles within those selectors
- Component SCSS partials compiled individually must continue to receive shared configuration from `_index.scss` via `additionalData`
- Design tokens from Style Dictionary (variables, spacing maps, color maps) must continue to resolve to the same values
- The `prebuild` step (token validation + Style Dictionary generation) must work without changes

**Scope:**
All inputs that do NOT involve the specific configuration changes or the two source file fixes should be completely unaffected. This includes:
- All SCSS files other than `src/utilities/_grid.scss` and `src/vendor/foundation/_settings.scss`
- All generated files in `src/generated/`
- All Foundation Sites files in `node_modules/`
- The build pipeline steps before webpack (token validation, Style Dictionary)

## Hypothesized Root Cause

Based on the bug description, the root causes are:

1. **sass-loader API default**: `sass-loader@13.2.0` defaults to the legacy Dart Sass JS API. The `api` option is not set in `webpack.config.js`, so it uses the deprecated default. Setting `api: 'modern-compiler'` eliminates these 3 warnings.

2. **@import deprecation (unfixable at source)**: The entire SCSS architecture relies on `@import` for global variable/mixin scoping. A full migration to `@use`/`@forward` is infeasible because:
   - `src/base/_app.scss` and `src/utilities.scss` use nested `@import` inside selector rules (`.layout-container, .reveal {}`), which cannot use `@use`
   - The `additionalData` prepend pattern (`@import "./src/_index.scss"`) relies on `@import`'s global scope
   - Foundation Sites itself uses `@import` internally
   - `@use` changes variable scoping rules, requiring every file to explicitly declare dependencies
   - The pragmatic fix is to silence `import` deprecation via `silenceDeprecations`

3. **Deprecated global built-in functions in project source**: `src/utilities/_grid.scss` uses `type-of()` at lines 168 and 185. This is a safe, targeted fix: add `@use 'sass:meta'` and replace `type-of()` with `meta.type-of()`.

4. **Deprecated global built-in functions in Foundation Sites**: Foundation's internal SCSS uses `map-values()`, `index()`, `type-of()`, `append()`. These cannot be fixed at source since they're in `node_modules`. Must silence `global-builtin` deprecation.

5. **Deprecated color functions in project source**: `src/vendor/foundation/_settings.scss` uses `darken()` at 4 call sites (lines 821, 822, 827, 829). This is a safe fix: add `@use 'sass:color'` and replace `darken($color, $amount)` with `color.adjust($color, $lightness: -$amount)`.

6. **Asset size warnings**: `utilities.css` at 512 KiB exceeds webpack's default 244 KiB limit. This is expected for a CSS library. Setting `performance: { hints: false }` suppresses these warnings.

## Correctness Properties

Property 1: Bug Condition - Build Produces Zero Warnings

_For any_ build execution where the bug condition holds (isBugCondition returns true on the current configuration), the fixed configuration and source code SHALL produce zero warnings in the build output while the build continues to succeed without errors.

**Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7**

Property 2: Preservation - CSS Output Identity

_For any_ SCSS entry point compiled by the build, the fixed build SHALL produce CSS output that is functionally identical to the CSS output produced by the unfixed build, preserving all selectors, properties, values, and specificity across `global.css`, `utilities.css`, `tokens.css`, and all component CSS files.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7**

## Fix Implementation

### Changes Required

Assuming our root cause analysis is correct:

**File**: `webpack.config.js`

**Section**: sass-loader options

**Specific Changes**:
1. **Add modern compiler API**: Add `api: 'modern-compiler'` to the sass-loader `options` object to switch from the deprecated JS API to the modern compiler API. This eliminates the 3 legacy JS API warnings.

2. **Add silenceDeprecations**: Add `silenceDeprecations: ['import', 'global-builtin']` to the `sassOptions` object within sass-loader options. This silences:
   - `import`: All ~400+ `@import` deprecation warnings (from both project source and Foundation Sites)
   - `global-builtin`: All deprecated global built-in function warnings from Foundation Sites (`map-values()`, `index()`, `type-of()`, `append()`)

3. **Add performance hints suppression**: Add `performance: { hints: false }` at the top level of the webpack config to suppress the 3 asset size warnings for `utilities.css`.

---

**File**: `src/utilities/_grid.scss`

**Function**: `.layout` block (lines 168, 185)

**Specific Changes**:
4. **Add sass:meta import**: Add `@use 'sass:meta'` at the top of the file (after the existing `@use 'sass:math'` statement).

5. **Replace type-of() calls**: Replace `type-of($size)` with `meta.type-of($size)` at both call sites (lines 168 and 185). This eliminates the 2 global built-in deprecation warnings from project source.

---

**File**: `src/vendor/foundation/_settings.scss`

**Section**: Table settings (lines 821-829)

**Specific Changes**:
6. **Add sass:color import**: Add `@use 'sass:color'` at the top of the file.

7. **Replace darken() calls**: Replace all 4 `darken()` calls with `color.adjust()`:
   - `darken($table-background, $table-hover-scale)` → `color.adjust($table-background, $lightness: -$table-hover-scale)`
   - `darken($table-background, $table-color-scale + $table-hover-scale)` → `color.adjust($table-background, $lightness: -($table-color-scale + $table-hover-scale))`
   - `darken($table-head-background, $table-hover-scale)` → `color.adjust($table-head-background, $lightness: -$table-hover-scale)`
   - `darken($table-foot-background, $table-hover-scale)` → `color.adjust($table-foot-background, $lightness: -$table-hover-scale)`

## Testing Strategy

### Validation Approach

The testing strategy follows a two-phase approach: first, surface counterexamples that demonstrate the bug on unfixed code, then verify the fix works correctly and preserves existing behavior. Since this is a build configuration + SCSS source fix, testing focuses on build output comparison rather than runtime behavior.

### Exploratory Bug Condition Checking

**Goal**: Surface counterexamples that demonstrate the bug BEFORE implementing the fix. Confirm or refute the root cause analysis. If we refute, we will need to re-hypothesize.

**Test Plan**: Run `npm run build` on the unfixed code and capture the warning output. Parse and categorize warnings to confirm the 5 categories and counts match expectations.

**Test Cases**:
1. **Legacy JS API Warning Test**: Run build and verify 3 "Legacy JS API" warnings appear in output (will fail on unfixed code)
2. **@import Deprecation Test**: Run build and verify ~400+ `@import` deprecation warnings appear (will fail on unfixed code)
3. **Global Built-in Test**: Run build and verify `type-of()` warnings from `_grid.scss` at lines 168, 185 (will fail on unfixed code)
4. **Deprecated Color Function Test**: Run build and verify `darken()` warnings from `_settings.scss` at lines 821, 822, 827, 829 (will fail on unfixed code)
5. **Asset Size Warning Test**: Run build and verify 3 asset size warnings for `utilities.css` (will fail on unfixed code)

**Expected Counterexamples**:
- Build output contains 435 warnings across 5 categories
- Possible causes confirmed: sass-loader API default, @import usage, global built-in functions, darken() calls, asset size limits

### Fix Checking

**Goal**: Verify that for all inputs where the bug condition holds, the fixed configuration produces the expected behavior.

**Pseudocode:**
```
FOR ALL buildConfig WHERE isBugCondition(buildConfig) DO
  result := runBuild_fixed(buildConfig)
  ASSERT result.warnings.count == 0
  ASSERT result.exitCode == 0
END FOR
```

### Preservation Checking

**Goal**: Verify that for all inputs where the bug condition does NOT hold, the fixed build produces the same result as the original build.

**Pseudocode:**
```
FOR ALL scssEntryPoint IN [global.scss, utilities.scss, tokens.scss, ...components] DO
  cssOutput_original := buildCSS_original(scssEntryPoint)
  cssOutput_fixed := buildCSS_fixed(scssEntryPoint)
  ASSERT cssOutput_original == cssOutput_fixed
END FOR
```

**Testing Approach**: Property-based testing is recommended for preservation checking because:
- It can generate many SCSS input variations to verify CSS output identity
- It catches edge cases where `color.adjust()` might produce slightly different values than `darken()`
- It provides strong guarantees that the `meta.type-of()` replacement is semantically identical

**Test Plan**: Capture CSS output from UNFIXED code for all entry points, then compare byte-for-byte with CSS output from FIXED code.

**Test Cases**:
1. **Global CSS Preservation**: Build `global.css` before and after fix, diff the output to verify identical CSS
2. **Utilities CSS Preservation**: Build `utilities.css` before and after fix, diff the output to verify identical CSS
3. **Tokens CSS Preservation**: Build `tokens.css` before and after fix, diff the output to verify identical CSS
4. **Component CSS Preservation**: Build each component CSS file before and after fix, diff outputs to verify identical CSS
5. **darken() → color.adjust() Equivalence**: Verify that `color.adjust($white, $lightness: -2%)` produces the same hex value as `darken($white, 2%)` for all 4 call sites

### Unit Tests

- Test that `meta.type-of()` returns the same values as `type-of()` for all Sass value types used in the project (maps, numbers, strings, colors, lists)
- Test that `color.adjust($color, $lightness: -N%)` produces identical color values to `darken($color, N%)` for the specific colors and percentages used in `_settings.scss`
- Test that the webpack config has `api: 'modern-compiler'` set in sass-loader options
- Test that `silenceDeprecations` includes `'import'` and `'global-builtin'`
- Test that `performance.hints` is set to `false`

### Property-Based Tests

- Generate random percentage values (0-100%) and verify `color.adjust($white, $lightness: -N%)` equals `darken($white, N%)` for all values
- Generate random Sass value types and verify `meta.type-of()` returns the same string as `type-of()` for each
- Generate random SCSS input configurations and verify the build produces zero warnings with the fixed config

### Integration Tests

- Run full `npm run build` with fixed configuration and verify zero warnings in stdout/stderr
- Run full `npm run build` and verify all expected output files exist in `dist/` and `src/components/`
- Compare CSS output checksums before and after fix to verify byte-for-byte identity
- Verify the build still succeeds with `--mode=production` flag
