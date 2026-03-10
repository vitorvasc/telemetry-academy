---
phase: quick-001
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/cases/001-hello-span/case.yaml
  - src/cases/002-auto-magic/case.yaml
  - src/cases/003-the-collector/case.yaml
  - src/data/caseLoader.ts
  - src/lib/rootCauseEngine.ts
  - src/main.tsx
  - src/App.tsx
  - package.json
autonomous: false
requirements: []
must_haves:
  truths:
    - "Pyodide threading error is confirmed resolved (already fixed in commit 5999881)"
    - "Case directories follow numbered-prefix format: 001-hello-span, 002-auto-magic, 003-the-collector"
    - "All caseId references updated to match new directory-derived IDs"
    - "Navigating to /case/001-hello-span loads and displays that case"
    - "Navigating to / shows the HomePage"
    - "Back button and case selection still work correctly"
  artifacts:
    - path: "src/cases/001-hello-span/case.yaml"
      provides: "Case definition with updated id"
    - path: "src/cases/002-auto-magic/case.yaml"
      provides: "Case definition with updated id"
    - path: "src/cases/003-the-collector/case.yaml"
      provides: "Case definition with updated id"
    - path: "src/lib/rootCauseEngine.ts"
      provides: "Root cause rules map with updated keys"
    - path: "src/main.tsx"
      provides: "Router setup wrapping App"
  key_links:
    - from: "src/data/caseLoader.ts"
      to: "src/cases/*/case.yaml"
      via: "import.meta.glob — directory name becomes caseId"
      pattern: "getCaseId.*split.*at\\(-2\\)"
    - from: "src/lib/rootCauseEngine.ts"
      to: "caseId"
      via: "Map lookup by caseId string"
      pattern: "\\{'001-hello-span'|'002-auto-magic'|'003-the-collector'"
    - from: "src/App.tsx"
      to: "wouter useParams/useLocation"
      via: "case slug routing"
---

<objective>
Rename case directories to numbered-prefix format, update all caseId references
throughout the codebase, and add URL-based case routing using wouter.

Note: The Pyodide threading error (RuntimeError: can't start new thread) was already
resolved in commit 5999881 by removing TracerProvider boilerplate from case setup.py
files and relying on the global provider in setup_telemetry.py. No further action needed
for that fix — this plan focuses on the rename and routing tasks.

Purpose: Numbered prefixes give cases a stable sort order in the filesystem and make
the codebase easier to navigate. URL routing enables direct linking, browser back/forward,
and bookmarkable case URLs.

Output: Renamed case directories, updated references, working /case/:id routes.
</objective>

<execution_context>
@/Users/vasconcellos/.claude/get-shit-done/workflows/execute-plan.md
@/Users/vasconcellos/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@src/data/caseLoader.ts
@src/lib/rootCauseEngine.ts
@src/App.tsx
@src/main.tsx
</context>

<tasks>

<task type="auto">
  <name>Task 1: Rename case directories and update all caseId references</name>
  <files>
    src/cases/001-hello-span/case.yaml,
    src/cases/002-auto-magic/case.yaml,
    src/cases/003-the-collector/case.yaml,
    src/data/caseLoader.ts,
    src/lib/rootCauseEngine.ts
  </files>
  <action>
    **Step 1 — Rename directories using git mv (preserves history):**
    ```
    git mv src/cases/hello-span-001 src/cases/001-hello-span
    git mv src/cases/auto-magic-002 src/cases/002-auto-magic
    git mv src/cases/the-collector-003 src/cases/003-the-collector
    ```

    **Step 2 — Update case.yaml id fields:**
    - `src/cases/001-hello-span/case.yaml`: Change `id: hello-span-001` → `id: 001-hello-span`
    - `src/cases/002-auto-magic/case.yaml`: Change `id: auto-magic-002` → `id: 002-auto-magic`
    - `src/cases/003-the-collector/case.yaml`: Change `id: the-collector-003` → `id: 003-the-collector`

    Note: caseLoader.ts derives caseId from the directory name (via getCaseId which
    splits path and takes the second-to-last segment). The `id` field in case.yaml is
    spread into the Case object, so it must match the directory-derived id or the object
    will have a stale `id` field. Update both.

    **Step 3 — Update caseLoader.ts comment:**
    Change the comment on line 23 from:
    `// '../cases/hello-span-001/case.yaml' -> 'hello-span-001'`
    to:
    `// '../cases/001-hello-span/case.yaml' -> '001-hello-span'`

    **Step 4 — Update rootCauseEngine.ts:**
    - Update the rules map keys (lines ~302-304):
      `'hello-span-001'` → `'001-hello-span'`
      `'auto-magic-002'` → `'002-auto-magic'`
      `'the-collector-003'` → `'003-the-collector'`
    - Update the comments in the file that reference the old IDs (lines ~113, ~201, ~257, ~354)

    **Step 5 — Check for localStorage migration concern:**
    The `useAcademyPersistence` hook stores progress keyed by caseId. Existing users'
    localStorage data will not migrate automatically (keys like `hello-span-001` become
    stale). Since this is a dev-phase project with no real users, this is acceptable.
    Add a note in `useAcademyPersistence.ts` (top comment) that caseIds changed in this
    refactor if a migration is ever needed.

    Do NOT change: `useAcademyPersistence.ts` logic (no code changes needed, just a comment).
    Do NOT change: `phase2.ts` (uses TS variable names like `helloSpanPhase2`, not caseId strings).
  </action>
  <verify>
    <automated>cd /Users/vasconcellos/projetos/telemetry-academy && npm run build 2>&amp;1 | tail -20</automated>
  </verify>
  <done>
    Build succeeds with no errors. Directories exist as 001-hello-span, 002-auto-magic,
    003-the-collector. Old directory names no longer exist. rootCauseEngine.ts map uses
    new keys.
  </done>
</task>

<task type="auto">
  <name>Task 2: Install wouter and add /case/:id slug routing</name>
  <files>
    package.json,
    src/main.tsx,
    src/App.tsx
  </files>
  <action>
    **Step 1 — Install wouter:**
    ```
    npm install wouter
    ```
    wouter is chosen over react-router because it is minimal (1.6kB), has zero
    dependencies, and works perfectly with Vite SPAs. It uses the same hook API pattern
    as react-router v6 but is far lighter.

    **Step 2 — Wrap app with Router in main.tsx:**
    Import `Router` from `wouter` and wrap the `<App />` render:
    ```tsx
    import { Router } from 'wouter';

    createRoot(document.getElementById('root')!).render(
      <StrictMode>
        <Router>
          <App />
        </Router>
      </StrictMode>,
    );
    ```

    **Step 3 — Add routing in App.tsx:**
    Import `useLocation`, `useParams` from `wouter` and `Route`, `Switch` from `wouter`.

    Current App.tsx navigation logic:
    - `showHome` state = true → renders `<HomePage>`
    - `showHome` state = false → renders the case view

    Replace state-based navigation with URL-based routing:

    ```tsx
    import { Switch, Route, useLocation } from 'wouter';

    function App() {
      const [location, setLocation] = useLocation();
      // ... existing state ...

      // Replace showHome state with URL check
      // Navigate to case: setLocation(`/case/${id}`)
      // Navigate home: setLocation('/')
    }
    ```

    Routing structure:
    ```
    <Switch>
      <Route path="/case/:id" component={CaseView} />
      <Route path="/" component={HomeView} />
    </Switch>
    ```

    Implementation approach — extract two sub-components or use inline Route:

    Option A (simpler, less refactor): Keep App.tsx logic as-is but drive
    `showHome`/`currentCaseId` from URL:

    ```tsx
    import { useLocation, useRoute } from 'wouter';

    function App() {
      const [location, setLocation] = useLocation();
      const [matchCase, params] = useRoute('/case/:id');

      // Derive showHome from URL
      const showHome = !matchCase;

      // Sync currentCaseId from URL params
      useEffect(() => {
        if (matchCase && params?.id) {
          const c = cases.find(x => x.id === params.id);
          if (c) setCurrentCaseId(params.id);
        }
      }, [matchCase, params?.id]);

      // Replace setShowHome(false) calls with setLocation(`/case/${id}`)
      // Replace setShowHome(true) calls with setLocation('/')
      const goToCase = (id: string) => {
        switchCase(id);
        setLocation(`/case/${id}`);
      };

      // ... rest of App unchanged ...
    }
    ```

    Prefer Option A as it minimizes the diff. The key changes in App.tsx:
    - Remove `const [showHome, setShowHome] = useState(true)`
    - Add `const [location, setLocation] = useLocation()`
    - Add `const [matchCase, params] = useRoute('/case/:id')`
    - Derive `showHome = !matchCase`
    - Replace `setShowHome(false)` → `setLocation('/case/${id}')`
    - Replace `setShowHome(true)` → `setLocation('/')`
    - Add useEffect to sync caseId from URL params on mount/change
    - Update `goToCase` to use `setLocation`

    **Step 4 — Handle direct URL navigation:**
    When user visits `/case/001-hello-span` directly (refresh or shared link), the
    `useRoute` match fires before any state is set. The `useEffect` syncing caseId from
    URL params handles this case — ensure it runs on mount when `matchCase` is true.

    **Step 5 — Vite SPA fallback (if needed for preview mode):**
    For `vite preview` or deployed SPAs, all routes must serve `index.html`. Add to
    `vite.config.ts` if it doesn't already have it:
    ```ts
    // In server/preview config — only needed for non-Netlify/Vercel deployments
    // historyApiFallback is handled automatically by vite dev server
    ```
    Check vite.config.ts first — vite dev server handles this automatically.
    Only add if `vite preview` fails to handle deep links.
  </action>
  <verify>
    <automated>cd /Users/vasconcellos/projetos/telemetry-academy && npm run build 2>&amp;1 | tail -20</automated>
  </verify>
  <done>
    Build succeeds. `npm run dev` starts without errors. The app renders at `/`,
    clicking a case navigates to `/case/001-hello-span` (visible in browser URL bar),
    and the back button returns to `/`.
  </done>
</task>

<task type="checkpoint:human-verify" gate="blocking">
  <what-built>
    - Renamed case dirs: 001-hello-span, 002-auto-magic, 003-the-collector
    - Updated all caseId references in rootCauseEngine.ts and case.yaml files
    - Installed wouter, added Router in main.tsx
    - URL-based routing: / shows home, /case/:id shows a case
  </what-built>
  <how-to-verify>
    1. Run: `npm run dev`
    2. Visit http://localhost:5173/ — HomePage should appear
    3. Click any case card — URL should change to `/case/001-hello-span` (or similar)
    4. Refresh the page at `/case/001-hello-span` — case should still load (not 404)
    5. Click the back arrow — URL should return to `/` and HomePage appears
    6. Click "Hello, Span" case, run some code, check that validation still works
    7. Verify no console errors about missing caseIds or rootCause rules
  </how-to-verify>
  <resume-signal>Type "approved" if everything works, or describe any issues found</resume-signal>
</task>

</tasks>

<verification>
- `npm run build` exits 0 with no TypeScript errors
- Old directory names (hello-span-001, auto-magic-002, the-collector-003) do not exist
- New directory names (001-hello-span, 002-auto-magic, 003-the-collector) exist with case.yaml and setup.py
- `rootCauseEngine.ts` map references '001-hello-span', '002-auto-magic', '003-the-collector'
- `wouter` appears in package.json dependencies
- Browser URL changes when navigating between home and cases
</verification>

<success_criteria>
- All three case directories renamed to numbered-prefix format
- Build succeeds with zero TypeScript or import errors
- Case slug routing works: / → home, /case/:id → case view
- Back button and browser history work correctly
- No regression in case validation or phase 2 investigation flows
</success_criteria>

<output>
After completion, create `.planning/quick/001-fix-pyodide-threading-rename-dirs-slug-routing/001-SUMMARY.md`
with what was done, files changed, and any decisions made.
</output>
