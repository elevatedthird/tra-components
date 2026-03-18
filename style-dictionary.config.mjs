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

/**
 * Generates SCSS variable names matching legacy naming conventions.
 *
 * Mapping rules by category:
 *   color.*          → join all segments with "--"  (e.g. color--brand--warm-black)
 *   spacing.scale.N  → spacing-N  (drop "scale")
 *   typography.font-size.{group}.{size}   → {group}-{size}-font-size
 *   typography.font-family.{name}         → {name}-font-family
 *   typography.font-weight.{name}         → font-weight-{name}
 *   typography.line-height.{group}.{size} → {group}-{size}-line-height
 *   shadow.elevation.{name}               → box-shadow-{name}
 *   breakpoint.screen.{name}              → breakpoint-{name}
 */
StyleDictionary.registerTransform({
  name: SCSS_LEGACY_NAME_TRANSFORM,
  type: 'name',
  transform: (token) => {
    const path = token.path;
    const category = path[0];

    if (category === 'color') {
      // color tokens: join all segments with "--"
      return path.join('--');
    }

    if (category === 'spacing') {
      // spacing.scale.N → spacing-N
      return `spacing-${path[path.length - 1]}`;
    }

    if (category === 'typography') {
      const subcategory = path[1]; // font-size, font-family, font-weight, line-height

      if (subcategory === 'font-size') {
        // typography.font-size.heading.xl → heading-xl-font-size
        const rest = path.slice(2);
        return `${rest.join('-')}-font-size`;
      }

      if (subcategory === 'font-family') {
        // typography.font-family.body → body-font-family
        return `${path[2]}-font-family`;
      }

      if (subcategory === 'font-weight') {
        // typography.font-weight.light → font-weight-light
        return `font-weight-${path[2]}`;
      }

      if (subcategory === 'line-height') {
        // typography.line-height.heading.xl → heading-xl-line-height
        const rest = path.slice(2);
        return `${rest.join('-')}-line-height`;
      }
    }

    if (category === 'shadow') {
      // shadow.elevation.primary → box-shadow-primary
      return `box-shadow-${path[path.length - 1]}`;
    }

    if (category === 'breakpoint') {
      // breakpoint.screen.small → breakpoint-small
      return `breakpoint-${path[path.length - 1]}`;
    }

    // Fallback: kebab-case join
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
      // spacing.scale.N → sq-spacing-N
      return `sq-spacing-${path[path.length - 1]}`;
    }

    if (category === 'shadow') {
      // shadow.elevation.primary → sq-box-shadow-primary
      return `sq-box-shadow-${path[path.length - 1]}`;
    }

    if (category === 'breakpoint') {
      // breakpoint.screen.small → sq-breakpoint-small
      return `sq-breakpoint-${path[path.length - 1]}`;
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
        t.path[1] === 'brand' &&
        t.path[2] === 'contrasting'
    );
    const contrastingEntries = contrasting.map(
      (t) =>
        `  "${t.path[3]}": $color--brand--contrasting--${t.path[3]},`
    );
    // Include warm-black as the last entry (it's a brand token, not contrasting)
    contrastingEntries.push('  "warm-black": $color--brand--warm-black,');
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
        t.path[1] === 'brand' &&
        t.path[2] === 'vibrant'
    );
    const vibrantEntries = vibrant.map(
      (t) =>
        `  "${t.path[3]}": $color--brand--vibrant--${t.path[3]},`
    );
    // Include pure-white as the last entry
    vibrantEntries.push('  "white": $color--brand--pure-white,');
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
      transforms: ['attribute/cti', 'name/kebab', SCSS_LEGACY_NAME_TRANSFORM],
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
      transforms: ['attribute/cti', 'name/kebab', CSS_SQ_PREFIX_TRANSFORM],
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
