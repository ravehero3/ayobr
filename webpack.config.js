const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const isProd = process.env.NODE_ENV === 'production';

module.exports = {
  mode: isProd ? 'production' : 'development',
  entry: './src/index.js',

  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: isProd ? '[name].[contenthash:8].bundle.js' : '[name].bundle.js',
    chunkFilename: isProd ? '[name].[contenthash:8].chunk.js' : '[name].chunk.js',
    publicPath: '/',
    clean: true,
  },

  // Persistent filesystem cache — dramatically speeds up rebuilds
  cache: {
    type: 'filesystem',
    buildDependencies: { config: [__filename] },
  },

  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            cacheDirectory: true,
            presets: [
              ['@babel/preset-env', { targets: { browsers: ['last 2 versions'] } }],
              ['@babel/preset-react', { runtime: 'automatic' }]
            ],
            plugins: [
              '@babel/plugin-syntax-dynamic-import'
            ]
          }
        }
      },
      {
        test: /\.css$/,
        use: [
          'style-loader',
          'css-loader',
          {
            loader: 'postcss-loader',
            options: {
              postcssOptions: {
                plugins: [
                  require('@tailwindcss/postcss'),
                  require('autoprefixer')
                ]
              }
            }
          }
        ]
      },
      // Webpack 5 native asset modules — faster than file-loader
      {
        test: /\.(png|jpe?g|gif|svg)$/i,
        type: 'asset/resource',
        generator: { filename: 'assets/images/[hash:8][ext]' },
      },
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/i,
        type: 'asset/resource',
        generator: { filename: 'assets/fonts/[hash:8][ext]' },
      },
      {
        test: /\.(mp3|wav|ogg)$/i,
        type: 'asset/resource',
        generator: { filename: 'assets/audio/[hash:8][ext]' },
      },
    ]
  },

  resolve: {
    extensions: ['.js', '.jsx', '.json'],
    alias: {
      '@':           path.resolve(__dirname, 'src'),
      '@components': path.resolve(__dirname, 'src/components'),
      '@hooks':      path.resolve(__dirname, 'src/hooks'),
      '@utils':      path.resolve(__dirname, 'src/utils'),
      '@store':      path.resolve(__dirname, 'src/store'),
      '@styles':     path.resolve(__dirname, 'src/styles'),
    }
  },

  plugins: [
    new HtmlWebpackPlugin({
      template: './index.html',
      filename: 'index.html',
    }),
  ],

  devServer: {
    static: { directory: path.join(__dirname, 'dist') },
    host: '0.0.0.0',
    port: 5000,
    hot: true,
    open: false,
    historyApiFallback: true,
    allowedHosts: 'all',
    proxy: [
      {
        context: ['/api'],
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
      }
    ],
    headers: {
      'Access-Control-Allow-Origin':  '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'X-Requested-With, content-type, Authorization',
      'Cross-Origin-Opener-Policy':   'same-origin',
      'Cross-Origin-Embedder-Policy': 'credentialless',
    },
    client: {
      overlay: { errors: true, warnings: false }
    },
  },

  target: 'web',

  optimization: {
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        // Heavy FFmpeg WASM — isolated so it only loads on /app
        ffmpeg: {
          test: /[\\/]node_modules[\\/]@ffmpeg[\\/]/,
          name: 'ffmpeg',
          chunks: 'all',
          priority: 30,
          filename: isProd ? 'ffmpeg.[contenthash:8].bundle.js' : 'ffmpeg.bundle.js',
        },
        // React + ReactDOM — tiny, loads fast, cached forever in prod
        react: {
          test: /[\\/]node_modules[\\/](react|react-dom|react-router-dom|scheduler)[\\/]/,
          name: 'react',
          chunks: 'all',
          priority: 20,
          filename: isProd ? 'react.[contenthash:8].bundle.js' : 'react.bundle.js',
        },
        // Everything else from node_modules
        vendors: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all',
          priority: 10,
          filename: isProd ? 'vendors.[contenthash:8].bundle.js' : 'vendors.bundle.js',
        },
      }
    },
    // In production: minify JS with Terser (default) and deduplicate modules
    minimize: isProd,
  },

  performance: {
    hints: isProd ? 'warning' : false,
    maxEntrypointSize: 512000,
    maxAssetSize: 2000000,
  },
};
