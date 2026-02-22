import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';
import path from 'node:path';

export default defineConfig({
  source: {
    entry: {
      index: './src/views/main.tsx',
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  plugins: [
    pluginReact(),
  ],
  output: {
    distPath: {
      root: 'dist',
      js: 'static/js',
      css: 'static/css',
    },
    filename: {
      js: '[name].[contenthash:8].js',
      css: '[name].[contenthash:8].css',
    },
    cleanDistPath: true,
  },
  server: {
    port: 3000,
    strictPort: true,
    open: true,
  },
  performance: {
    chunkSplit: {
      strategy: 'split-by-experience',
      forceSplitting: {
        vendors: /[\\/]node_modules[\\/]/,
      },
    },
  },
  html: {
    template: './index.html',
    scriptLoading: 'blocking',
    inject: 'body',
  },
});