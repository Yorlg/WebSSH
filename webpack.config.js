const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = {
  mode: 'production',
  entry: {
    main: './static/js/main.js'
  },
  devServer: {
    port: 9530,
    proxy: {
      '/ssh': {
        target: 'http://localhost:8080',
        ws: true,
        changeOrigin: true,
      }
    }

  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'js/[name].[contenthash].js',
    publicPath: '/'
  },
  optimization: {
    splitChunks: {
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all'
        }
      }
    }
  },
  module: {
    rules: [
      {
        test: /\.css$/,
        use: [
          MiniCssExtractPlugin.loader,
          'css-loader'
        ],
      }
    ]
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './static/index.html',
      favicon: './static/favicon.ico'
    }),
    new MiniCssExtractPlugin({
      filename: 'css/style.[contenthash].css' // 生成的CSS文件名和路径
    })
  ],
  performance: {
    hints: 'warning',
    hints: 'error',
    hints: false,
    maxEntrypointSize: 512000,
    maxAssetSize: 512000,
    assetFilter: function (assetFilename) {
      return assetFilename.endsWith('.css') || assetFilename.endsWith('.js');
    }
  }

};
