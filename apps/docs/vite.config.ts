import path from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const uiBitsRoot = path.resolve(__dirname, '../../packages/ui-bits')

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 1500,
  },
  resolve: {
    alias: [
      { find: 'ui-bits/style.css', replacement: path.resolve(uiBitsRoot, 'src/style.css') },
      { find: 'ui-bits', replacement: path.resolve(uiBitsRoot, 'src/library.ts') },
    ],
    dedupe: ['react', 'react-dom'],
  },
  server: {
    fs: {
      allow: [path.resolve(__dirname, '../..')],
    },
  },
})
