import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { createHtmlPlugin } from 'vite-plugin-html'
import fs from 'fs'
import path from 'path'

// Custom plugin to inject env.js before main bundle
const injectEnvPlugin = () => ({
  name: 'inject-env',
  transformIndexHtml: {
    enforce: 'pre',
    transform(html, { path: htmlPath }) {
      // Check if env.js exists in public folder
      const envJsPath = path.join(process.cwd(), 'public', 'env.js')
      const envExists = fs.existsSync(envJsPath)
      
      // Inject env.js script tag before the main script
      const envScript = '<script src="/env.js"></script>'
      
      if (html.includes('</head>')) {
        return html.replace('</head>', `${envScript}\n  </head>`)
      }
      
      return html
    }
  }
})

export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    injectEnvPlugin()
  ],
  server: {
    port: 3000,
    open: true
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'ag-grid': ['ag-grid-react', 'ag-grid-community']
        }
      }
    }
  },
  // Define env prefix for Vite env variables
  envPrefix: 'VITE_'
}))
