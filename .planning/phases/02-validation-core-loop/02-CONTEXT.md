# Phase 2: Validation & Core Loop - Context

**Gathered:** 2026-03-02
**Status:** Ready for planning

<domain>
## Phase Boundary

Users receive real-time validation on their instrumentation code by checking actual captured telemetry spans (not string matching), can progress through cases linearly with persistent state across browser reloads. Requirements: CORE-05, LOOP-01, LOOP-02, LOOP-04.

</domain>

<decisions>
## Implementation Decisions

### Validation Logic
- Schema matching against real span JSON objects — check for span patterns (name, attributes, structure), not exact values
- Validation runs automatically after code execution — single Run action triggers execute → capture spans → validate
- Validation rules defined inline in case data (alongside existing `phase1.validations` array pattern)
- Progressive error messages: start with hints ("No span named process-order found"), escalate to guided fixes after 3 failed attempts on the same check ("use tracer.start_as_current_span('process-order')")

### Feedback Timing
- Staggered reveal: validation results appear one by one with animation delay (existing ValidationPanel slide-in pattern)
- Show spinner in validation panel during code execution ("Running code...")
- Celebration animation + auto-unlock Investigation tab when all checks pass
- Reset all validation results on every Run — clean slate, no stale results
- Editing code clears validation results — user must re-run to re-validate

### Case Progression
- Strict linear unlock: case N+1 only available after case N is fully solved (both instrumentation + investigation)
- Users can replay solved cases with full reset (progress, attempts, time reset)
- Case tabs (CaseSelector) are sufficient for progress indication — no additional progress bar needed

### Persistence (localStorage)
- Save both progress AND user's current code for each case
- Auto-save on every state change (case solved, phase unlocked, attempt logged, code edited)
- Schema version key — if version mismatches on load, wipe data and start fresh
- Visible "Reset All Progress" button with confirmation dialog

### Claude's Discretion
- Spinner design and animation details
- Celebration animation choice (confetti, glow, etc.)
- Exact localStorage key naming and structure
- How progressive hints scale (thresholds, wording)
- Reset button placement (settings, footer, etc.)

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `ValidationPanel` (src/components/ValidationPanel.tsx): Already has animated slide-in cards, pass/fail icons, success message — extend for real span validation
- `CaseSelector` (src/components/CaseSelector.tsx): Already shows locked/available/in-progress/solved with icons — no changes needed for unlock logic
- `CaseSolvedScreen` (src/components/CaseSolvedScreen.tsx): Star rating, stats, "what you learned" — already built
- `useCodeRunner` hook (src/hooks/useCodeRunner.ts): Captures spans as `any[]` via postMessage — validation engine reads from this
- `RootCauseSelector` (src/components/RootCauseSelector.tsx): Attempt tracking pattern reusable for progressive hints

### Established Patterns
- State management: inline `useState` in App.tsx with `updateProgress()` helper
- Animation: Tailwind `animate-slide-in` with `animationDelay` for staggered reveals
- Case data: cases defined in `src/data/cases.ts` with Phase1Config/Phase2Config
- Telemetry bridge: Python spans serialize to JSON, captured in `spans` array from `useCodeRunner`

### Integration Points
- `App.tsx` `simulateValidation()` (line ~125): Replace with real span-based validation engine
- `App.tsx` `allProgress` state: Wrap with localStorage load/save
- `App.tsx` `handleCaseSolved()`: Trigger localStorage persist
- `src/types.ts` `ValidationRule`: Extend type to support span schema matching
- `src/data/cases.ts`: Add span-based validation rules to case definitions

</code_context>

<specifics>
## Specific Ideas

No specific references — open to standard approaches for validation engine and localStorage patterns.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 02-validation-core-loop*
*Context gathered: 2026-03-02*
