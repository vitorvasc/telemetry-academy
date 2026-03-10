# Technology Stack

**Analysis Date:** 2026-03-10

## Languages

**Primary:**
- TypeScript 5.9.3 - All application source code in `src/`
- Python (via Pyodide 0.29.3 WASM) - User-submitted code executed in-browser

**Secondary:**
- CSS (Tailwind utility classes) - Styling via `src/index.css`, `src/App.css`
- YAML - Case definitions in `src/cases/*/case.yaml`
- Python (setup scripts) - OTel telemetry bootstrap in `src/workers/python/setup_telemetry.py`

## Runtime

**Environment:**
- Browser (no server runtime required — fully client-side)
- Web Workers for Pyodide WASM execution (`src/workers/python.worker.ts`)

**Node.js (dev/build only):**
- v24.13.0 (local environment)
- Not required at runtime

**Package Manager:**
- npm
- Lockfile: `package-lock.json` present (lockfileVersion 3)

## Frameworks

**Core:**
- React 19.2.0 - UI framework, component tree rooted at `src/main.tsx`
- React DOM 19.2.0 - DOM rendering

**Build/Dev:**
- Vite 7.3.1 - Dev server and production bundler, configured in `vite.config.ts`
- TypeScript compiler (tsc) 5.9.3 - Type checking, config in `tsconfig.app.json` and `tsconfig.node.json`

**Styling:**
- Tailwind CSS 4.2.1 - Utility-first CSS, loaded via `@tailwindcss/vite` Vite plugin
- PostCSS 8.5.6 - CSS processing pipeline
- Autoprefixer 10.4.24 - Vendor prefix automation

**Testing:**
- No test framework detected (no jest/vitest config, no `*.test.*` or `*.spec.*` files found)

## Key Dependencies

**Critical:**
- `pyodide` 0.29.3 - Python runtime in WASM; loaded from CDN `https://cdn.jsdelivr.net/pyodide/v0.29.3/full/` at runtime; Python packages `opentelemetry-api` and `opentelemetry-sdk` installed via `micropip` on worker init
- `@monaco-editor/react` 4.7.0 - VSCode-based code editor component used in `src/components/CodeEditor.tsx`
- `js-yaml` (types only via `@types/js-yaml` 4.0.9, actual runtime via `js-yaml` bundled dep) - YAML parsing in `src/lib/validation.ts` for the YAML config case type
- `lucide-react` 0.575.0 - Icon library used throughout UI components

**Build Plugins:**
- `@vitejs/plugin-react` 5.1.1 - React Fast Refresh and JSX transform
- `@modyfi/vite-plugin-yaml` 1.1.1 - Enables `import.meta.glob('*.yaml')` in `src/data/caseLoader.ts`

**Linting:**
- `eslint` 9.39.1 with flat config (`eslint.config.js`)
- `typescript-eslint` 8.48.0 - TypeScript-aware lint rules
- `eslint-plugin-react-hooks` 7.0.1 - Hooks rules enforcement
- `eslint-plugin-react-refresh` 0.4.24 - Fast Refresh compliance

## Configuration

**TypeScript:**
- Target: `ES2022`
- Module: `ESNext` with bundler resolution
- Strict mode enabled with `noUnusedLocals`, `noUnusedParameters`, `erasableSyntaxOnly`
- JSX: `react-jsx` (no React import needed in TSX files)
- Config: `tsconfig.app.json` (source), `tsconfig.node.json` (build tools)

**Vite:**
- Plugins: React, Tailwind CSS, YAML loader
- Worker format: `es` (ES module workers for Pyodide compatibility)
- Config: `vite.config.ts`

**ESLint:**
- Flat config format in `eslint.config.js`
- Applies to `**/*.{ts,tsx}` files
- Ignores `dist/`

**Environment:**
- No `.env` files present — no runtime environment variables required
- All configuration is compile-time or hardcoded (e.g., Pyodide CDN URL in `src/workers/python.worker.ts`)

**Build:**
- `npm run build` — runs `tsc -b && vite build`
- Output: `dist/` directory
- `npm run dev` — Vite dev server with HMR
- `npm run lint` — ESLint
- `npm run preview` — Preview production build

## Platform Requirements

**Development:**
- Node.js with npm
- Modern browser for manual testing

**Production:**
- Static file host only (no server required)
- Domain configured as `https://telemetry.academy/` (per `index.html` OG meta)
- Browser must support WebAssembly (for Pyodide), Web Workers, and ES modules
- Pyodide runtime fetched from `https://cdn.jsdelivr.net/pyodide/v0.29.3/full/` on first load

---

*Stack analysis: 2026-03-10*
