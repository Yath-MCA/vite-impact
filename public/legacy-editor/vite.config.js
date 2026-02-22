import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { babel } from '@rollup/plugin-babel';
import legacy from '@vitejs/plugin-legacy';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react({
      // Use classic runtime for better ES5 compatibility
      jsxRuntime: 'classic'
    }),
    
    // Babel plugin for ES5 transpilation
    babel({
      babelHelpers: 'bundled',
      exclude: 'node_modules/**',
      extensions: ['.js', '.jsx', '.ts', '.tsx'],
      presets: [
        ['@babel/preset-env', {
          targets: {
            ie: '11'
          },
          modules: false,
          useBuiltIns: 'usage',
          corejs: 3
        }],
        '@babel/preset-react'
      ],
      plugins: [
        // Transform class properties for ES5
        '@babel/plugin-transform-class-properties',
        // Transform optional chaining
        '@babel/plugin-transform-optional-chaining',
        // Transform nullish coalescing
        '@babel/plugin-transform-nullish-coalescing-operator'
      ]
    }),
    
    // Legacy plugin for polyfills
    legacy({
      targets: ['ie >= 11'],
      additionalLegacyPolyfills: ['regenerator-runtime/runtime'],
      renderLegacyChunks: true,
      polyfills: [
        'es.promise',
        'es.promise.finally',
        'es.array.iterator',
        'es.object.assign',
        'es.object.values',
        'es.string.includes',
        'es.string.starts-with',
        'es.string.ends-with',
        'es.array.from',
        'es.array.find',
        'es.array.find-index',
        'es.map',
        'es.set',
        'web.dom-collections.for-each',
        'web.dom-collections.iterator'
      ]
    })
  ],

  build: {
    // Output format: IIFE for browser globals
    lib: {
      entry: path.resolve(__dirname, 'src/main.jsx'),
      name: 'ImpactApp',
      formats: ['iife'],
      fileName: () => 'impact-app.js'
    },
    
    // No hash in filenames for legacy compatibility
    rollupOptions: {
      output: {
        entryFileNames: 'impact-app.js',
        chunkFileNames: 'impact-app-[name].js',
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.');
          const ext = info[info.length - 1];
          if (/css/i.test(ext)) {
            return 'impact-app.css';
          }
          return 'assets/[name][extname]';
        },
        // Ensure no external dependencies (bundle everything)
        inlineDynamicImports: true
      }
    },
    
    // Minification settings
    minify: 'terser',
    terserOptions: {
      ecma: 5,
      compress: {
        drop_console: false, // Keep console for debugging
        drop_debugger: true
      },
      format: {
        comments: false
      }
    },
    
    // Source maps for debugging
    sourcemap: true,
    
    // Output directory
    outDir: 'dist',
    
    // Empty output directory
    emptyOutDir: true,
    
    // Target ES5
    target: 'es5'
  },

  // CSS handling
  css: {
    extract: true,
    modules: false
  },

  // Development server
  server: {
    port: 3000,
    open: true
  },

  // Resolve aliases
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@services': path.resolve(__dirname, './src/services'),
      '@components': path.resolve(__dirname, './src/components'),
      '@events': path.resolve(__dirname, './src/events')
    }
  },

  // Optimize dependencies
  optimizeDeps: {
    include: ['react', 'react-dom']
  },

  // ESBuild target
  esbuild: {
    target: 'es5',
    jsx: 'transform'
  }
});
