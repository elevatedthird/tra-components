const path = require('path');
const glob = require('glob');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const RemoveEmptyScriptsPlugin = require('webpack-remove-empty-scripts');

// Build dynamic component entries
function getComponentEntries() {
  const entries = {};

  // Find all component .es6.js files
  const jsFiles = glob.sync('src/components/sq-*/*.es6.js');
  jsFiles.forEach(file => {
    const dir = path.dirname(file);
    const basename = path.basename(file, '.es6.js');
    entries[`${dir}/${basename}`] = [`./${file}`];
  });

  // Find all component .scss files (partials prefixed with _sq-)
  const scssFiles = glob.sync('src/components/sq-*/_sq-*.scss');
  scssFiles.forEach(file => {
    const dir = path.dirname(file);
    // _sq-accordion.scss -> sq-accordion.css
    const basename = path.basename(file, '.scss').replace(/^_/, '');
    const entryKey = `${dir}/${basename}`;
    if (entries[entryKey]) {
      // Combine with existing JS entry
      entries[entryKey].push(`./${file}`);
    } else {
      entries[entryKey] = `./${file}`;
    }
  });

  return entries;
}

const componentEntries = getComponentEntries();

module.exports = {
  entry: {
    // Global entries -> dist/
    'dist/css/global': './src/global.scss',
    'dist/css/utilities': './src/utilities.scss',
    'dist/css/tokens': './src/generated/_custom-properties.scss',
    // Component entries -> src/components/sq-*/
    ...componentEntries,
  },
  context: __dirname,
  output: {
    filename: '[name].js',
    path: __dirname,
    assetModuleFilename: 'dist/assets/[name][ext]'
  },
  cache: {
    type: 'filesystem',
    compression: 'gzip',
  },
  experiments: {
    backCompat: false,
  },
  optimization: {
    splitChunks: false
  },
  module: {
    rules: [
      {
        test: /\.(svg)$/,
        exclude: '/node_modules/',
        type: 'asset/inline',
      },
      {
        test: /\.(png|jpg|gif|woff2?|ttf|otf|eot)$/,
        exclude: '/node_modules/',
        type: 'asset/resource',
      },
      {
        test: /\.es6\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env']
          }
        }
      },
      {
        test: /\.scss$/,
        use: [
          MiniCssExtractPlugin.loader,
          'css-loader',
          {
            loader: 'sass-loader',
            options: {
              api: 'modern',
              additionalData: `@import "${path.resolve(__dirname, 'src/_index.scss').replace(/\\/g, '/')}";`,
              sassOptions: {
                loadPaths: [
                  path.resolve(__dirname, 'src'),
                  path.resolve(__dirname, 'node_modules'),
                  path.resolve(__dirname, 'node_modules/foundation-sites/scss'),
                ],
                silenceDeprecations: ['import', 'global-builtin'],
              },
            },
          }
        ]
      }
    ]
  },
  plugins: [
    new RemoveEmptyScriptsPlugin(),
    new MiniCssExtractPlugin({
      filename: '[name].css'
    })
  ],
  performance: {
    hints: false,
  },
  devtool: 'source-map',
  mode: 'development'
};
