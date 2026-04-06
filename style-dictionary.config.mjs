/**
 * Style Dictionary v4 Configuration
 *
 * Transforms token source files (tokens/) into:
 * - SCSS variables: src/generated/_variables.scss
 * - CSS custom properties: src/generated/_custom-properties.scss (--sq- prefix)
 * - JSON flat output: dist/tokens.json
 */
import StyleDictionary from 'style-dictionary';

// Custom transform name constants
const SCSS_LEGACY_NAME_TRANSFORM = 'name/scss-legacy';
const CSS_SQ_PREFIX_TRANSFORM = 'name/css-sq-prefix';
const FONT_FAMILY_VALUE_TRANSFORM = 'value/font-family-unquote';

/**
 * Strips wrapping quotes from font-family token values so that
 * Style Dictionary's scss/variables format does not double-quote them.
 *
 * Applies to both base font-family tokens (typography.font-family.*)
 * and per-font-id font-family references (typography.{fontId}.font-family).
 */
StyleDictionary.registerTransform({
  name: FONT_FAMILY_VALUE_TRANSFORM,
  type: 'value',
  filter: (token) => {
    // Base definitions: typography.font-family.body
    if (token.path[1] === 'font-family') return true;
    // Per-font-id references: typography.size.{fontId}.font-family
    if (token.path[0] === 'typography' && token.path[token.path.length - 1] === 'font-family') return true;
    return false;
  },
  transform: (token) => {
    return token.value.replace(/"([^"]+)"/g, '$1');
  },
});

/**
 * Generates SCSS variable names matching legacy naming conventions.
 *
 * Mapping rules by category:
 *   color.*                                              → join all segments with "--"
 *   spacing.scale.N                                      → spacing-N
 *   typography.font-family.{name}                        → {name}-font-family
 *   typography.font-weight.{name}                        → font-weight-{name}
 *   typography.size.{fontId}.desktop-font-size            → {fontId}-font-size
 *   typography.size.{fontId}.mobile-font-size             → {fontId}-smallscreen-font-size
 *   typography.size.{fontId}.line-height                  → {fontId}-line-height
 *   typography.size.{fontId}.font-family                  → {fontId}-font-family
 *   shadow.elevation.{name}                              → box-shadow-{name}
 *   breakpoint.screen.{name}                             → breakpoint-{name}
 */
StyleDictionary.registerTransform({
  name: SCSS_LEGACY_NAME_TRANSFORM,
  type: 'name',
  transform: (token) => {
    const path = token.path;
    const category = path[0];

    if (category === 'color') {
      if (path[1] === 'contrasting' || path[1] === 'vibrant') {
        return `color--brand--${path.slice(1).join('--')}`;
      }
      return path.join('--');
    }

    if (category === 'spacing') {
      return `spacing-${path[path.length - 1]}`;
    }

    if (category === 'typography') {
      const sub = path[1];

      // Base font-family definitions: typography.font-family.body → body-font-family
      if (sub === 'font-family') {
        return `${path[2]}-font-family`;
      }

      // Font-weight: typography.font-weight.light → font-weight-light
      if (sub === 'font-weight') {
        return `font-weight-${path[2]}`;
      }

      // Size tokens: typography.size.{fontId}.{prop}
      if (sub === 'size') {
        const fontId = path[2]; // e.g. "heading-xl"
        const prop = path[3];   // e.g. "desktop-font-size", "mobile-font-size", "line-height", "font-family"

        if (prop === 'desktop-font-size') {
          return `${fontId}-font-size`;
        }
        if (prop === 'mobile-font-size') {
          return `${fontId}-smallscreen-font-size`;
        }
        if (prop === 'line-height') {
          return `${fontId}-line-height`;
        }
        if (prop === 'font-family') {
          return `${fontId}-font-family`;
        }
        return `${fontId}-${prop}`;
      }

      // Fallback for any other typography sub-token
      return path.slice(1).join('-');
    }

    if (category === 'shadow') {
      return `box-shadow-${path[path.length - 1]}`;
    }

    if (category === 'breakpoint') {
      return `breakpoint-${path[path.length - 1]}`;
    }

    return path.join('-');
  },
});

/**
 * Generates CSS custom property names with --sq- prefix in kebab-case.
 *
 * Applies the same structural simplifications as the SCSS transform
 * but uses single "-" separators throughout and prepends "sq-".
 */
StyleDictionary.registerTransform({
  name: CSS_SQ_PREFIX_TRANSFORM,
  type: 'name',
  transform: (token) => {
    const path = token.path;
    const category = path[0];

    if (category === 'spacing') {
      return `sq-spacing-${path[path.length - 1]}`;
    }

    if (category === 'shadow') {
      return `sq-box-shadow-${path[path.length - 1]}`;
    }

    if (category === 'breakpoint') {
      return `sq-breakpoint-${path[path.length - 1]}`;
    }

    if (category === 'typography') {
      const sub = path[1];

      // Base definitions: typography.font-family.body → sq-typography-font-family-body
      if (sub === 'font-family' || sub === 'font-weight') {
        return `sq-${path.join('-')}`;
      }

      // Per-font-id: typography.{fontId}.font-size.desktop → sq-typography-{fontId}-font-size-desktop
      return `sq-${path.join('-')}`;
    }

    if (category === 'color') {
      // Preserve legacy CSS naming for contrasting/vibrant
      if (path[1] === 'contrasting' || path[1] === 'vibrant') {
        return `sq-color-brand-${path.slice(1).join('-')}`;
      }
      return `sq-${path.join('-')}`;
    }

    // Default: sq- prefix + all path segments joined with "-"
    return `sq-${path.join('-')}`;
  },
});

// ---------------------------------------------------------------------------
// Custom Format: SCSS Spacing Map
// ---------------------------------------------------------------------------
// Generates $spacing-map from spacing.scale tokens, referencing $spacing-N vars.

StyleDictionary.registerFormat({
  name: 'scss/spacing-map',
  format: ({ dictionary }) => {
    const header = [
      '// Do not edit directly, this file was auto-generated.',
      '',
      '$base-spacing: 1rem !default;',
      '$spacing-sm: ($base-spacing * 0.5) !default;',
      '',
    ];

    const tokens = dictionary.allTokens
      .filter((t) => t.path[0] === 'spacing' && t.path[1] === 'scale')
      .sort((a, b) => Number(a.path[2]) - Number(b.path[2]));

    const entries = ['  0: 0,'];
    for (const t of tokens) {
      const key = t.path[2];
      entries.push(`  ${key}: $spacing-${key},`);
    }

    return [
      ...header,
      '$spacing-map: (',
      ...entries,
      ') !default;',
      '',
    ].join('\n');
  },
});

// ---------------------------------------------------------------------------
// Custom Format: SCSS Color Maps
// ---------------------------------------------------------------------------
// Generates $contrasting-colors, $vibrant-colors, and neutral short-form
// aliases from color tokens.

StyleDictionary.registerFormat({
  name: 'scss/color-maps',
  format: ({ dictionary }) => {
    const lines = [
      '// Do not edit directly, this file was auto-generated.',
      '',
    ];

    // --- Neutral short-form aliases ---
    lines.push('// Neutral color aliases');
    const neutrals = dictionary.allTokens.filter(
      (t) =>
        t.path[0] === 'color' &&
        t.path[1] === 'neutral' &&
        // Only the legacy short-form names (exclude newer tokens like neutral-100)
        /^(white|black|black-base|inactive-grey|light-grey-\d|dark-grey-\d)$/.test(
          t.path[2]
        )
    );
    for (const t of neutrals) {
      lines.push(
        `$color--${t.path[2]}: $color--neutral--${t.path[2]} !default;`
      );
    }

    // --- Contrasting colors map ---
    lines.push('');
    lines.push('// Contrasting colors map');
    const contrasting = dictionary.allTokens.filter(
      (t) =>
        t.path[0] === 'color' &&
        t.path[1] === 'contrasting'
    );
    const contrastingEntries = contrasting.map(
      (t) =>
        `  "${t.path[2]}": $color--brand--contrasting--${t.path[2]},`
    );
    // Include warm-black as the last entry (it's a brand token, not contrasting)
    contrastingEntries.push('  "warm-black": $color--base--warm-black,');
    lines.push(
      '$contrasting-colors: (',
      ...contrastingEntries,
      ') !default;',
    );

    // --- Vibrant colors map ---
    lines.push('');
    lines.push('// Vibrant colors map');
    const vibrant = dictionary.allTokens.filter(
      (t) =>
        t.path[0] === 'color' &&
        t.path[1] === 'vibrant'
    );
    const vibrantEntries = vibrant.map(
      (t) =>
        `  "${t.path[2]}": $color--brand--vibrant--${t.path[2]},`
    );
    // Include pure-white as the last entry
    vibrantEntries.push('  "white": $color--base--pure-white,');
    lines.push(
      '$vibrant-colors: (',
      ...vibrantEntries,
      ') !default;',
    );

    lines.push('');
    return lines.join('\n');
  },
});

const config = {
  source: ['tokens/**/*.json'],

  platforms: {
    scss: {
      transformGroup: 'scss',
      transforms: ['attribute/cti', 'name/kebab', SCSS_LEGACY_NAME_TRANSFORM, FONT_FAMILY_VALUE_TRANSFORM],
      buildPath: 'src/generated/',
      files: [
        {
          destination: '_variables.scss',
          format: 'scss/variables',
          options: {
            outputReferences: true,
          },
        },
        {
          destination: '_spacing-map.scss',
          format: 'scss/spacing-map',
          filter: (token) => token.path[0] === 'spacing',
        },
        {
          destination: '_color-maps.scss',
          format: 'scss/color-maps',
          filter: (token) => token.path[0] === 'color',
        },
      ],
    },

    css: {
      transformGroup: 'css',
      transforms: ['attribute/cti', 'name/kebab', CSS_SQ_PREFIX_TRANSFORM, FONT_FAMILY_VALUE_TRANSFORM],
      prefix: 'sq',
      buildPath: 'src/generated/',
      files: [
        {
          destination: '_custom-properties.scss',
          format: 'css/variables',
          options: {
            outputReferences: true,
          },
        },
      ],
    },

    json: {
      transformGroup: 'js',
      buildPath: 'dist/',
      files: [
        {
          destination: 'tokens.json',
          format: 'json/flat',
        },
      ],
    },
  },
};

export default config;
