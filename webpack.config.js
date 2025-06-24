const path = require('path');
const fs = require('fs');
const glob = require('glob');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const RemoveEmptyScriptsPlugin = require('webpack-remove-empty-scripts');

const scssEntries = glob.sync('./src/**/*.scss').reduce((entries, file) => {
  const absPath = path.resolve(__dirname, file);
  const outPath = path.relative(path.resolve(__dirname, 'src'), absPath)
    .replace(/\/_/, '/')
    .replace(/\.scss$/, '');
  entries[outPath] = absPath;
  return entries;
}, {});

const jsEntries = glob.sync('./src/**/*.es6.js').reduce((entries, file) => {
  const absPath = path.resolve(__dirname, file);
  const outPath = path.relative(path.resolve(__dirname, 'src'), absPath)
    .replace(/\/_/, '/')
    .replace(/\.es6\.js$/, '');
  entries[outPath] = absPath;
  return entries;
}, {});
module.exports = {
  entry: {
    ...scssEntries,
    ...jsEntries
  },
  context: __dirname,
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'src'),
    assetModuleFilename: 'assets/[name][ext]'
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
        test: /\.es6.js\.js$/,
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
              additionalData: '@import "tra-global-styles/src/00-config/_index.scss";',
              sassOptions: {
                includePaths: [
                  path.resolve(__dirname, 'node_modules/tra-global-styles/src/00-config'),
                  path.resolve(__dirname, 'node_modules/foundation-sites/scss'),
                ],
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
  devtool: 'source-map',
  mode: 'development'
};
