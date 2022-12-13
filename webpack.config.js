const webpack = require('webpack');
const path = require('path');
const tampermonkey = require('./tampermonkey/config');

module.exports = {
  entry: './src/index.ts',
  mode: 'development',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      }
    ],
  },
  plugins: [
    new webpack.BannerPlugin({ banner: tampermonkey.header, entryOnly: true, raw: true})
  ],
  resolve: {
    extensions: ['.ts', '.js'],
  },
  output: {
    filename: 'ammy-coupon-card.js',
    path: path.resolve(__dirname, 'dist'),
  },
};
