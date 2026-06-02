import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  server: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp'
    },
    fs: {
      allow: ['/home/ze/projects']
    }
  },
  optimizeDeps: {
    exclude: ['@sqlite.org/sqlite-wasm']
  },
  resolve: {
    alias: {
      '@capacitor/preferences': path.resolve(__dirname, 'src/stubs/capacitor-preferences.ts'),
      '@capacitor-community/sqlite': path.resolve(__dirname, 'src/stubs/capacitor-sqlite.ts'),
      'keytar': path.resolve(__dirname, 'src/stubs/keytar.ts'),
      'fs/promises': path.resolve(__dirname, 'src/stubs/fs-promises.ts'),
      'better-sqlite3': path.resolve(__dirname, 'src/stubs/keytar.ts'),
      '@sqlite.org/sqlite-wasm': path.resolve(__dirname, 'node_modules/@sqlite.org/sqlite-wasm/dist/index.mjs')
    }
  }
})
