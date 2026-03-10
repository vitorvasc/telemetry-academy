# Codebase Structure

**Analysis Date:** 2026-03-10

## Directory Layout

```
telemetry-academy/
├── src/
│   ├── App.tsx                  # Root component; all cross-cutting state
│   ├── main.tsx                 # React DOM entry point
│   ├── types.ts                 # Root-level shared types (Case, ValidationRule, etc.)
│   ├── App.css                  # App-level styles
│   ├── index.css                # Global CSS (Tailwind base)
│   ├── assets/                  # Static assets (images, icons)
│   ├── cases/                   # Case content (YAML + Python per case)
│   │   ├── hello-span-001/
│   │   │   ├── case.yaml        # Case metadata, validations, root cause options
│   │   │   └── setup.py         # Starter Python code shown to student
│   │   ├── auto-magic-002/
│   │   │   ├── case.yaml
│   │   │   └── setup.py
│   │   └── the-collector-003/
│   │       ├── case.yaml
│   │       └── setup.py
│   ├── components/              # UI components (React)
│   │   ├── index.ts             # Barrel export (partial)
│   │   ├── CodeEditor.tsx       # Monaco-based code editor
│   │   ├── InstructionsPanel.tsx # Phase 1 instructions sidebar
│   │   ├── ValidationPanel.tsx  # Phase 1 validation results + run button
│   │   ├── InvestigationView.tsx # Phase 2 container (tabs: traces/logs/rootcause)
│   │   ├── TraceViewer.tsx      # Trace waterfall visualization
│   │   ├── LogViewer.tsx        # Filterable log stream
│   │   ├── RootCauseSelector.tsx # Multiple-choice root cause UI + feedback
│   │   ├── CaseSelector.tsx     # Dropdown for switching cases
│   │   ├── CaseSolvedScreen.tsx # Success screen after case completion
│   │   ├── HomePage.tsx         # Case grid / landing page
│   │   ├── ReviewModal.tsx      # Post-solve review of spans + answer
│   │   ├── WelcomeModal.tsx     # First-visit onboarding modal
│   │   └── terminal/
│   │       └── OutputPanel.tsx  # Python stdout display
│   ├── data/                    # Static data + case discovery
│   │   ├── cases.ts             # Exports `cases` array (calls loadCases())
│   │   ├── caseLoader.ts        # Auto-discovers cases via import.meta.glob
│   │   ├── phase2.ts            # Static Phase2Data for hello-span-001
│   │   └── progress.ts          # Progress utility exports
│   ├── hooks/                   # React hooks (stateful logic)
│   │   ├── useCodeRunner.ts     # Web Worker lifecycle, Python execution, span capture
│   │   ├── useAcademyPersistence.ts # localStorage read/write, debounced auto-save
│   │   └── usePhase2Data.ts     # Transforms raw OTel spans into Phase2Data
│   ├── lib/                     # Pure business logic (no React)
│   │   ├── validation.ts        # Span + YAML validation engine (9 check types)
│   │   ├── rootCauseEngine.ts   # Per-case root cause evaluation rules
│   │   ├── spanTransform.ts     # Raw OTel → TraceSpan conversion + status badges
│   │   └── logGenerator.ts      # TraceSpan[] → LogEntry[] synthesis
│   ├── types/                   # Domain type definitions
│   │   ├── phase2.ts            # TraceSpan, LogEntry, Phase2Data, RootCauseOption
│   │   ├── progress.ts          # CaseProgress, CaseStatus, PersistedState
│   │   └── yaml.d.ts            # Type declaration for YAML imports
│   └── workers/                 # Web Worker + Python runtime setup
│       ├── python.worker.ts     # Pyodide Web Worker (init + run message handlers)
│       └── python/
│           └── setup_telemetry.py # OTel TracerProvider + JSSpanExporter + JSStdout
├── public/                      # Static public assets
├── dist/                        # Build output (generated, not committed)
├── coverage/                    # Test coverage output (generated)
├── docs/                        # Developer documentation
│   └── ADDING_CASES.md          # YAML schema reference for case authors
├── .planning/                   # Project planning docs (committed)
│   ├── codebase/                # This directory — codebase analysis docs
│   ├── phases/                  # Phase PLAN, CONTEXT, VERIFICATION docs
│   └── ...
├── .claude/                     # Claude agent configuration
│   ├── agents/                  # Agent definitions
│   ├── commands/                # Custom slash commands
│   └── skills/                  # Skill definitions (new-case, validate-case)
├── index.html                   # Vite HTML template
├── vite.config.ts               # Vite config (react, tailwindcss, yaml plugins)
├── tsconfig.json                # TypeScript project references
├── tsconfig.app.json            # App tsconfig
├── package.json                 # Dependencies and scripts
└── CLAUDE.md                    # Project instructions for Claude
```

## Directory Purposes

**`src/cases/<id>/`:**
- Purpose: All content for one learning case — completely self-contained
- Contains: `case.yaml` (metadata + validations + root cause options), `setup.py` (starter code)
- Key files: `case.yaml` is the source of truth for case behavior; `setup.py` is the initial editor content

**`src/components/`:**
- Purpose: All React UI components
- Contains: Page-level views (`HomePage`, `CaseSolvedScreen`), panel components (`InstructionsPanel`, `ValidationPanel`, `InvestigationView`), feature components (`TraceViewer`, `LogViewer`, `RootCauseSelector`), modals (`ReviewModal`, `WelcomeModal`)
- Key files: `InvestigationView.tsx` composes the entire Phase 2 UI; `App.tsx` assembles the overall layout

**`src/hooks/`:**
- Purpose: React custom hooks that encapsulate side effects and derived state
- Contains: Worker management, persistence, span transformation
- Key files: `useCodeRunner.ts` owns the Worker and execution pipeline; `useAcademyPersistence.ts` owns all localStorage I/O

**`src/lib/`:**
- Purpose: Framework-free business logic — importable and testable without React
- Contains: Validation engine, root cause evaluation, span transformation utilities, log generation
- Key files: `validation.ts` is the core of Phase 1; `rootCauseEngine.ts` is the core of Phase 2

**`src/data/`:**
- Purpose: Runtime data access — case discovery and static case data
- Contains: `caseLoader.ts` uses Vite glob imports for build-time discovery; `phase2.ts` contains legacy static data
- Key files: `caseLoader.ts` is the mechanism by which adding a new folder to `src/cases/` automatically registers the case

**`src/types/`:**
- Purpose: Shared TypeScript interface definitions (no runtime code)
- Contains: Phase 2 domain types, progress tracking types, YAML module declaration
- Key files: `src/types.ts` (root-level) holds the `Case`, `ValidationRule`, and `ValidationResult` types used in Phase 1

**`src/workers/`:**
- Purpose: Web Worker source and Python runtime support scripts
- Contains: `python.worker.ts` runs in a separate thread; `setup_telemetry.py` is injected at worker init to configure OTel
- Key files: `setup_telemetry.py` defines `JSSpanExporter` — the bridge from Python OTel spans to JS

## Key File Locations

**Entry Points:**
- `src/main.tsx`: React DOM mount
- `index.html`: Vite HTML template, loads `src/main.tsx`

**Configuration:**
- `vite.config.ts`: Build config — enables `@vitejs/plugin-react`, `@tailwindcss/vite`, `@modyfi/vite-plugin-yaml`, ES worker format
- `tsconfig.app.json`: TypeScript config for source files
- `package.json`: Dependencies and `dev`/`build`/`test` scripts

**Core Logic:**
- `src/lib/validation.ts`: Validation engine — the only place `ValidationCheckType` is defined
- `src/lib/rootCauseEngine.ts`: Root cause rules registry — add new case rules here
- `src/lib/spanTransform.ts`: OTel → UI conversion — touch here if span display changes
- `src/workers/python/setup_telemetry.py`: OTel bootstrap in Pyodide — touch here for worker instrumentation changes

**Case Discovery:**
- `src/data/caseLoader.ts`: Glob-based auto-discovery — determines sort order and merges YAML + Python

**State Persistence:**
- `src/hooks/useAcademyPersistence.ts`: localStorage key is `'telemetry-academy'`, schema version is `1`

**Testing:**
- `src/lib/validation.test.ts` (if exists): Unit tests for the validation engine
- Test framework: Vitest (inferred from package.json patterns)

## Naming Conventions

**Files:**
- React components: `PascalCase.tsx` (e.g., `TraceViewer.tsx`, `ValidationPanel.tsx`)
- React hooks: `camelCase.ts` prefixed with `use` (e.g., `useCodeRunner.ts`, `usePhase2Data.ts`)
- Library modules: `camelCase.ts` (e.g., `spanTransform.ts`, `logGenerator.ts`)
- Type-only files: `camelCase.ts` in `src/types/` (e.g., `phase2.ts`, `progress.ts`)
- Test files: `*.test.ts` co-located with source or in same directory
- Case IDs: `kebab-case` with numeric suffix (e.g., `hello-span-001`, `auto-magic-002`)

**Directories:**
- Component groupings: PascalCase directories (e.g., `terminal/`) for sub-component groups
- Case directories: `kebab-case-NNN` matching the case `id` field in YAML

**TypeScript:**
- Interfaces: `PascalCase` (e.g., `ValidationRule`, `Phase2Data`)
- Types: `PascalCase` (e.g., `CaseStatus`, `AppPhase`)
- Enums: Not used; string literal unions used instead (e.g., `'ok' | 'error' | 'warning'`)

## Where to Add New Code

**New Case (most common):**
1. Create `src/cases/<id>/case.yaml` — define metadata, `phase1.validations`, `phase2.rootCauseOptions`
2. Create `src/cases/<id>/setup.py` — write the starter Python code
3. Add case-specific root cause rules to `src/lib/rootCauseEngine.ts` — add entry to `RULES_REGISTRY`
4. Verify: case appears automatically via `caseLoader.ts` at next dev server start

**New Validation Check Type:**
- Add type string to `ValidationCheckType` union in `src/lib/validation.ts`
- Add case to `runCheck()` switch in `src/lib/validation.ts`
- Add to `ValidationRule['type']` union in `src/types.ts`

**New UI Component:**
- Implementation: `src/components/ComponentName.tsx`
- Export from `src/components/index.ts` if it needs broad use
- Sub-components of a feature: `src/components/<feature>/SubComponent.tsx`

**New Hook:**
- Implementation: `src/hooks/useHookName.ts`
- Follow pattern: return named properties, not arrays

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
- Purpose: Vitest coverage reports
- Generated: Yes
- Committed: No

**`.planning/`:**
- Purpose: Project planning documents (RESEARCH, CONTEXT, PLAN, VERIFICATION per phase)
- Generated: No (human/agent authored)
- Committed: Yes

**`.claude/`:**
- Purpose: Claude agent definitions, skills, and custom commands for project automation
- Generated: No
- Committed: Yes

**`node_modules/`:**
- Purpose: npm dependencies
- Generated: Yes
- Committed: No

---

*Structure analysis: 2026-03-10*
