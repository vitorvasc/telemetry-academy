# Codebase Structure

**Analysis Date:** 2026-03-13

## Directory Layout

```
telemetry-academy/
├── src/
│   ├── App.tsx                  # Root component; all cross-cutting state and layout
│   ├── main.tsx                 # React DOM entry point; wouter Router
│   ├── types.ts                 # Root-level shared types (Case, ValidationRule, etc.)
│   ├── App.css                  # App-level styles
│   ├── index.css                # Global CSS (Tailwind base)
│   ├── assets/                  # Static assets (images, icons)
│   ├── cases/                   # Case content — one directory per case
│   │   ├── 001-hello-span/
│   │   │   ├── case.yaml        # Case metadata, validations, root cause options
│   │   │   └── setup.py         # Starter Python code shown to student
│   │   ├── 002-auto-magic/
│   │   │   ├── case.yaml
│   │   │   └── setup.py
│   │   └── 003-the-collector/
│   │       ├── case.yaml        # YAML-config type case (no Python worker)
│   │       └── setup.py
│   ├── components/              # UI components (React)
│   │   ├── index.ts             # Barrel export (partial — CodeEditor, InstructionsPanel, ValidationPanel)
│   │   ├── CodeEditor.tsx       # Monaco-based code editor (lazy-loaded)
│   │   ├── InstructionsPanel.tsx # Phase 1 instructions sidebar
│   │   ├── ValidationPanel.tsx  # Phase 1 validation results + run button
│   │   ├── InvestigationView.tsx # Phase 2 container (tabs: traces/logs/rootcause)
│   │   ├── TraceViewer.tsx      # Trace waterfall visualization
│   │   ├── LogViewer.tsx        # Filterable log stream
│   │   ├── RootCauseSelector.tsx # Multiple-choice root cause UI + feedback
│   │   ├── CaseSelector.tsx     # Dropdown for switching cases (desktop header)
│   │   ├── MobileCaseDrawer.tsx # Drawer for switching cases (mobile)
│   │   ├── CaseSolvedScreen.tsx # Success screen after case completion
│   │   ├── HomePage.tsx         # Case grid / landing page
│   │   ├── ReviewModal.tsx      # Post-solve review of spans + answer
│   │   ├── WelcomeModal.tsx     # First-visit onboarding modal
│   │   ├── ErrorBoundary.tsx    # React error boundary wrapper
│   │   └── terminal/
│   │       └── OutputPanel.tsx  # Python stdout display
│   ├── data/                    # Static data + case discovery
│   │   ├── cases.ts             # Exports `cases` array (calls loadCases())
│   │   ├── caseLoader.ts        # Auto-discovers cases via import.meta.glob
│   │   ├── phase2.ts            # Static Phase2Data per case (phase2Registry)
│   │   └── progress.ts          # Progress utility exports
│   ├── hooks/                   # React custom hooks
│   │   ├── useCodeRunner.ts     # Web Worker lifecycle, Python execution, span capture
│   │   ├── useAcademyPersistence.ts # localStorage read/write, debounced auto-save
│   │   ├── usePhase2Data.ts     # Transforms raw OTel spans into Phase2Data
│   │   └── __tests__/           # Hook unit tests
│   ├── lib/                     # Pure business logic (no React)
│   │   ├── validation.ts        # Span + YAML validation engine (9 check types)
│   │   ├── rootCauseEngine.ts   # Per-case root cause evaluation rules + RULES_REGISTRY
│   │   ├── spanTransform.ts     # Raw OTel → TraceSpan conversion + status badges
│   │   ├── logGenerator.ts      # TraceSpan[] → LogEntry[] synthesis
│   │   ├── formatters.ts        # Shared display formatters (formatSpanMs, etc.)
│   │   └── __tests__/           # Lib unit tests
│   ├── types/                   # Domain type definitions
│   │   ├── phase2.ts            # TraceSpan, LogEntry, Phase2Data, RootCauseOption
│   │   ├── progress.ts          # CaseProgress, CaseStatus
│   │   └── yaml.d.ts            # Type declaration for YAML imports
│   └── workers/                 # Web Worker + Python runtime setup
│       ├── python.worker.ts     # Pyodide Web Worker (init + run message handlers)
│       ├── python.worker.test.ts # Worker unit tests
│       └── python/
│           └── setup_telemetry.py # OTel TracerProvider + JSSpanExporter + JSStdout
├── public/                      # Static public assets (_headers, favicon, robots.txt, sitemap.xml)
├── dist/                        # Build output (generated, not committed)
├── coverage/                    # Test coverage output (generated)
├── docs/                        # Developer documentation
├── .planning/                   # Project planning docs (committed)
│   ├── codebase/                # Codebase analysis docs (this directory)
│   ├── phases/                  # Phase PLAN, CONTEXT, VERIFICATION docs
│   ├── quick/                   # Quick fix planning docs
│   └── ROADMAP.md, STATE.md     # Current project state
├── .claude/                     # Claude agent configuration
│   ├── agents/                  # Agent definitions
│   ├── commands/                # Custom slash commands (/scaffold-case, /lint-case, /case-status)
│   └── skills/                  # Skill definitions (new-case, validate-case)
├── .github/
│   └── workflows/               # CI/CD pipeline
├── index.html                   # Vite HTML template
├── vite.config.ts               # Vite config (react, tailwindcss, yaml plugins, worker format)
├── tsconfig.json                # TypeScript project references
├── tsconfig.app.json            # App tsconfig
├── tsconfig.node.json           # Node/config tsconfig
├── package.json                 # Dependencies and scripts
├── CLAUDE.md                    # Project instructions for Claude
└── README.md                    # Project overview
```

## Directory Purposes

**`src/cases/<NNN-case-name>/`:**
- Purpose: All content for one learning case — completely self-contained
- Contains: `case.yaml` (metadata + validations + root cause options), `setup.py` (starter code shown in editor)
- Key files: `case.yaml` is the source of truth for case behavior; the `order` field in YAML determines sequence

**`src/components/`:**
- Purpose: All React UI components
- Contains: Page-level views (`HomePage`, `CaseSolvedScreen`), panel components (`InstructionsPanel`, `ValidationPanel`, `InvestigationView`), feature components (`TraceViewer`, `LogViewer`, `RootCauseSelector`), modals (`ReviewModal`, `WelcomeModal`), layout utilities (`ErrorBoundary`, `MobileCaseDrawer`, `CaseSelector`)
- Key files: `InvestigationView.tsx` composes the entire Phase 2 UI; `CodeEditor.tsx` is lazy-loaded

**`src/hooks/`:**
- Purpose: React custom hooks that encapsulate side effects and derived state
- Key files: `useCodeRunner.ts` owns the Web Worker and execution pipeline; `useAcademyPersistence.ts` owns all localStorage I/O; `usePhase2Data.ts` owns the Phase 1 → Phase 2 data bridge

**`src/lib/`:**
- Purpose: Framework-free business logic — importable and testable without React
- Key files: `validation.ts` is the core of Phase 1; `rootCauseEngine.ts` is the core of Phase 2; `spanTransform.ts` is the boundary between raw OTel data and UI types

**`src/data/`:**
- Purpose: Runtime data access — case discovery and static Phase 2 data
- Key files: `caseLoader.ts` — adding a new directory to `src/cases/` auto-registers it here; `phase2.ts` — static investigation data per case; cases not registered here fall back to user's live spans

**`src/types/`:**
- Purpose: Shared TypeScript interface definitions (no runtime code)
- Key files: `src/types.ts` (root-level) holds `Case`, `ValidationRule`, and `ValidationResult` used in Phase 1; `src/types/phase2.ts` holds investigation domain types

**`src/workers/`:**
- Purpose: Web Worker source and Python runtime support scripts
- Key files: `python.worker.ts` — runs in a separate thread, communicates via `postMessage`; `setup_telemetry.py` — defines `JSSpanExporter`, the bridge from Python OTel spans to JS

## Key File Locations

**Entry Points:**
- `src/main.tsx`: React DOM mount with `wouter` Router
- `index.html`: Vite HTML template, loads `src/main.tsx`

**Configuration:**
- `vite.config.ts`: Build config — enables `@vitejs/plugin-react`, `@tailwindcss/vite`, `@modyfi/vite-plugin-yaml`; sets worker format to `es`; configures Vitest
- `tsconfig.app.json`: TypeScript config for source files
- `package.json`: Dependencies and `dev`/`build`/`test`/`coverage` scripts

**Core Logic:**
- `src/lib/validation.ts`: Validation engine — only place `ValidationCheckType` union is defined
- `src/lib/rootCauseEngine.ts`: Root cause rules registry — add new case rules here in `RULES_REGISTRY`
- `src/lib/spanTransform.ts`: OTel → UI conversion — touch here for span display changes
- `src/workers/python/setup_telemetry.py`: OTel bootstrap in Pyodide — touch here for worker instrumentation changes

**Case Discovery:**
- `src/data/caseLoader.ts`: Glob-based auto-discovery; determines sort order

**State Persistence:**
- `src/hooks/useAcademyPersistence.ts`: localStorage key `'telemetry-academy'`, schema version `2`

**Testing:**
- `src/lib/__tests__/`: Unit tests for lib modules
- `src/hooks/__tests__/`: Unit tests for hooks
- `src/workers/python.worker.test.ts`: Worker unit tests
- `src/components/CaseSelector.test.tsx`, `src/components/InstructionsPanel.test.tsx`: Component tests

## Naming Conventions

**Files:**
- React components: `PascalCase.tsx` (e.g., `TraceViewer.tsx`, `ValidationPanel.tsx`)
- React hooks: `camelCase.ts` prefixed with `use` (e.g., `useCodeRunner.ts`, `usePhase2Data.ts`)
- Library modules: `camelCase.ts` (e.g., `spanTransform.ts`, `logGenerator.ts`)
- Type-only files: `camelCase.ts` in `src/types/` (e.g., `phase2.ts`, `progress.ts`)
- Test files: `*.test.ts` or `*.test.tsx`, co-located or in `__tests__/` subdirectory
- Case IDs and directories: `NNN-kebab-name` with numeric prefix (e.g., `001-hello-span`, `002-auto-magic`, `003-the-collector`)

**Directories:**
- Sub-component groups: lowercase (e.g., `terminal/`) for feature-grouped sub-components
- Case directories: match the case `id` field in `case.yaml` exactly

**TypeScript:**
- Interfaces: `PascalCase` (e.g., `ValidationRule`, `Phase2Data`, `RootCauseRule`)
- Type aliases: `PascalCase` (e.g., `CaseStatus`, `AppPhase`, `ValidationCheckType`)
- Enums: Not used; string literal unions used instead (e.g., `'ok' | 'error' | 'warning'`)
- No default exports for components — use named exports (e.g., `export const CodeEditor`)

## Where to Add New Code

**New Case (most common):**
1. Create `src/cases/<NNN-name>/case.yaml` — metadata, `phase1.validations`, `phase2.rootCauseOptions`; set `order` field
2. Create `src/cases/<NNN-name>/setup.py` — starter Python code
3. Add static Phase 2 data to `src/data/phase2.ts` — register in `phase2Registry`
4. Add root cause rules to `src/lib/rootCauseEngine.ts` — add `RootCauseRule[]` and register in `RULES_REGISTRY`
5. Case auto-discovered via `caseLoader.ts` — verify in dev server console

**New Validation Check Type:**
- Add type string to `ValidationCheckType` union in `src/lib/validation.ts`
- Add case to `runCheck()` switch in `src/lib/validation.ts`
- Add to `ValidationRule['type']` union in `src/types.ts`

**New UI Component:**
- Implementation: `src/components/ComponentName.tsx`
- Export from `src/components/index.ts` only if broadly reused
- Sub-components of a feature: `src/components/<feature>/SubComponent.tsx`

**New Hook:**
- Implementation: `src/hooks/useHookName.ts`
- Return named properties object, not array tuple

**New Library Utility:**
- Shared helpers with no React: `src/lib/utilityName.ts`
- Pure functions only — no `useState`, no `useEffect`

**New Types:**
- Phase 2 domain types: `src/types/phase2.ts`
- Progress/game state types: `src/types/progress.ts`
- Case/Phase 1 types: `src/types.ts` (root level)

## Special Directories

**`dist/`:**
- Purpose: Vite build output
- Generated: Yes
- Committed: No

**`coverage/`:**
- Purpose: Vitest coverage reports (HTML + lcov)
- Generated: Yes
- Committed: No

**`.planning/`:**
- Purpose: Project planning documents (RESEARCH, CONTEXT, PLAN, VERIFICATION per phase; codebase analysis docs)
- Generated: No (human/agent authored)
- Committed: Yes

**`.claude/`:**
- Purpose: Claude agent definitions, skills, and custom slash commands for project automation
- Generated: No
- Committed: Yes

**`node_modules/`:**
- Purpose: npm dependencies
- Generated: Yes
- Committed: No

---

*Structure analysis: 2026-03-13*
