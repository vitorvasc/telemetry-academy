/// <reference types="vitest" />
import { execSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'
import ViteYaml from '@modyfi/vite-plugin-yaml'

const pkg = JSON.parse(readFileSync('./package.json', 'utf-8')) as {
  version: string
}
const commitHash = (() => {
  try {
    return execSync('git rev-parse --short=7 HEAD').toString().trim()
  } catch {
    return 'dev'
  }
})()

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), ViteYaml()],
  build: {
    // Pyodide WASM requires ES2020+ (top-level await, BigInt, optional chaining)
    target: 'es2020',
  },
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
    __COMMIT_HASH__: JSON.stringify(commitHash),
  },
  worker: {
    format: 'es',
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
