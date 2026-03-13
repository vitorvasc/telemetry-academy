# Technology Stack

**Analysis Date:** 2026-03-13

## Languages

**Primary:**
- TypeScript ~5.9.3 - All application source in `src/`
- Python (Pyodide WASM) - Student code executed in-browser; OTel bootstrap in `src/workers/python/setup_telemetry.py`

**Secondary:**
- CSS - Global styles (`src/index.css`, `src/App.css`)
- YAML - Case content definitions (`src/cases/*/case.yaml`)

## Runtime

**Environment:**
- Browser (fully client-side — no server required)
- Python runs inside a Pyodide WebAssembly Web Worker (`src/workers/python.worker.ts`)

**Node.js:**
- Required: ≥20.0.0 (enforced in `package.json` `engines` field)
- Used for build toolchain only; not required at runtime

**Package Manager:**
- npm
- Lockfile: `package-lock.json` present (lockfileVersion 3)

## Frameworks

**Core:**
- React 19.2.x - UI framework; component tree rooted at `src/main.tsx`
- wouter 3.9.x - Client-side routing (`<Router>`, `useRoute`, `useLocation`); NOT React Router

**UI / Styling:**
- Tailwind CSS 4.2.x - Utility-first CSS; Vite plugin `@tailwindcss/vite`
- `@tailwindcss/typography` 0.5.x - Prose styles for `react-markdown` in `src/components/InstructionsPanel.tsx`
- lucide-react 0.577.x - Icon library used throughout UI

**Editor:**
- `@monaco-editor/react` 4.7.x - VSCode-based code editor (`src/components/CodeEditor.tsx`); supports Python and YAML language modes; lazy-loaded to avoid blocking initial render

**Layout:**
- `react-resizable-panels` 4.7.x - Resizable desktop panel layout in `src/App.tsx`; panel sizes persisted to `localStorage` via `useDefaultLayout`

**Markdown:**
- `react-markdown` 10.1.x - Renders case instruction markdown in `src/components/InstructionsPanel.tsx`

**Python / WASM:**
- `pyodide` 0.29.3 - Python WASM runtime; loaded from jsDelivr CDN on worker init (`https://cdn.jsdelivr.net/pyodide/v0.29.3/full/`). CDN URL and package version must stay in sync.
- `opentelemetry-api` + `opentelemetry-sdk` (Python) - Installed at runtime into Pyodide via `micropip`; student code instruments against this SDK

**Testing:**
- vitest 4.0.x - Test runner; configured inline in `vite.config.ts`
- `@testing-library/react` 16.3.x - Component tests
- `@testing-library/jest-dom` 6.9.x - DOM matchers
- `@testing-library/user-event` 14.6.x - User interaction simulation
- `@vitest/ui` 4.0.x - Interactive browser UI for test runs
- `@vitest/coverage-v8` 4.0.x - Code coverage (v8 provider); outputs text, HTML, and lcov
- jsdom 28.1.x - JSDOM environment for all tests

**Build/Dev:**
- vite 7.3.x - Dev server and production bundler; `vite.config.ts`
- `@vitejs/plugin-react` 5.1.x - React Fast Refresh + JSX transform
- `@modyfi/vite-plugin-yaml` 1.1.x - Enables `import.meta.glob('*.yaml')` used by `src/data/caseLoader.ts`

## Key Dependencies

**Critical:**
- `pyodide` 0.29.3 - The CDN URL in `src/workers/python.worker.ts` line `indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.29.3/full/'` must match the npm version. Upgrading either requires updating both.
- `@monaco-editor/react` - Monaco bundles significant assets; lazy-loaded in `src/App.tsx` via `React.lazy`
- `react-resizable-panels` v4 - Changed API in v4 (`useDefaultLayout`, `useGroupRef`); used throughout `src/App.tsx`
- `wouter` - Lightweight alternative to React Router; breaking change if swapped

**Infrastructure:**
- `js-yaml` 4.1.x - YAML parsing used by validation logic for the `yaml-config` case type (`src/lib/validation.ts`)

## Configuration

**TypeScript:**
- `tsconfig.json` - References `tsconfig.app.json` and `tsconfig.node.json`
- `tsconfig.app.json` - App source; target ES2022, strict mode, `skipLibCheck: true` (required for Pyodide type declaration conflicts)
- `tsconfig.node.json` - Vite config only; target ES2023

**ESLint:**
- `eslint.config.js` - Flat config; three rule groups:
  1. All `.ts`/`.tsx` - type-checked rules, async correctness (`no-floating-promises`, `no-misused-promises`), `consistent-type-imports`, `switch-exhaustiveness-check`
  2. `*.worker.ts` - unsafe rules disabled (Pyodide has no TypeScript types)
  3. `*.test.*` / `*.spec.*` - unsafe rules disabled, vitest plugin enabled

**Vite:**
- `vite.config.ts` - Build target `es2020` (required for Pyodide/WASM BigInt support); worker format `es`; test environment `jsdom`

**Git Hooks:**
- `husky` 9.1.x - `pre-commit`: runs `lint-staged`; `commit-msg`: runs `commitlint`
- `lint-staged` 16.3.x - ESLint `--fix` on staged `*.ts`/`*.tsx`
- `@commitlint/cli` + `@commitlint/config-conventional` - Enforces Conventional Commits

**Build Scripts:**
```bash
npm run dev           # Vite dev server with HMR
npm run build         # tsc -b && vite build → dist/
npm run lint          # ESLint
npm run preview       # Preview production build
npm run test          # vitest run (single pass)
npm run test:watch    # vitest (watch mode)
npm run test:coverage # vitest run --coverage
```

## Platform Requirements

**Development:**
- Node.js ≥20.0.0 with npm

**Production:**
- Static file hosting only (no server required)
- Deployed to `https://telemetry.academy/`
- Browser must support WebAssembly, Web Workers, and ES Modules
- `public/_headers` defines security headers; CSP explicitly whitelists `cdn.jsdelivr.net` for scripts and fetch connections
- No environment variables required — all config is compile-time or CDN URLs hardcoded in source

---

*Stack analysis: 2026-03-13*
