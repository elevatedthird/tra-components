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
