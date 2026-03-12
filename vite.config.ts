/// <reference types="vitest" />
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'
import ViteYaml from '@modyfi/vite-plugin-yaml'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), ViteYaml()],
  build: {
    // Pyodide WASM requires ES2020+ (top-level await, BigInt, optional chaining)
    target: 'es2020',
  },
  worker: {
    format: 'es'
  },
  test: {
    environment: 'jsdom',
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      exclude: ['node_modules/', 'dist/', '**/*.d.ts', 'src/data/phase2.ts'],
    },
  },
})
