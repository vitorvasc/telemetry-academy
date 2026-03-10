/// <reference types="vitest" />
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'
import ViteYaml from '@modyfi/vite-plugin-yaml'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), ViteYaml()],
  worker: {
    format: 'es'
  },
  test: {
    environment: 'jsdom',
    globals: true,
  },
})
