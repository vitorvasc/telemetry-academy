---
phase: quick-05
plan: 01
subsystem: ui-components
tags: [markdown, react-markdown, tailwindcss-typography, instructions-panel]
dependency_graph:
  requires: []
  provides: [markdown-rendering-in-instructions-panel]
  affects: [src/components/InstructionsPanel.tsx]
tech_stack:
  added: [react-markdown@10.1.0, "@tailwindcss/typography@0.5.19"]
  patterns: [prose wrapper div, ReactMarkdown v10 API (className on wrapper not component)]
key_files:
  created: []
  modified:
    - src/components/InstructionsPanel.tsx
    - src/index.css
    - package.json
    - package-lock.json
decisions:
  - "react-markdown v10 does not accept className prop directly; className goes on a wrapper div"
  - "Tailwind v4 CSS-first config uses @plugin directive in index.css, not tailwind.config.ts"
metrics:
  duration: 3 min
  completed: "2026-03-10"
  tasks_completed: 2
  files_modified: 4
---

# Quick Task 05: Fix Markdown Rendering in Instructions Panel — Summary

**One-liner:** ReactMarkdown with @tailwindcss/typography prose classes renders bold, headers, lists, and inline code from YAML case descriptions and hints.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Install react-markdown and @tailwindcss/typography | 4997a6c | package.json, package-lock.json, src/index.css |
| 2 | Replace whitespace-pre-line divs with ReactMarkdown | a54a8a5 | src/components/InstructionsPanel.tsx |

## What Was Built

- Installed `react-markdown@^10.1.0` and `@tailwindcss/typography@^0.5.19`
- Registered `@plugin "@tailwindcss/typography"` in `src/index.css` (Tailwind v4 CSS-first approach)
- In `InstructionsPanel.tsx`:
  - Added `import ReactMarkdown from 'react-markdown'`
  - Phase 1 description: `<div className={mdClass}><ReactMarkdown>...</ReactMarkdown></div>` with full prose styling
  - Hints: each hint wrapped in `<span className={hintMdClass}><ReactMarkdown>...</ReactMarkdown></span>` — inline styling with `[&>p]:inline` to prevent layout break
  - Phase 2 description: same prose wrapper pattern as Phase 1

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] react-markdown v10 API: className prop not accepted on component**
- **Found during:** Task 2, first build attempt
- **Issue:** Plan specified `<ReactMarkdown className={mdClass}>` but react-markdown v10 `Options` type does not include `className`. TypeScript error: `Property 'className' does not exist on type 'IntrinsicAttributes & Readonly<Options>'`
- **Fix:** Moved className to a wrapper `<div>` (descriptions) or `<span>` (hint items inline), with bare `<ReactMarkdown>` inside
- **Files modified:** src/components/InstructionsPanel.tsx
- **Commit:** a54a8a5

## Success Criteria

- [x] react-markdown and @tailwindcss/typography installed
- [x] Phase 1 and Phase 2 descriptions render markdown (bold, lists, headers)
- [x] Hints with backtick code render inline `code` styled with sky-300 on slate-800
- [x] Build passes with no errors (`npm run build` exits 0)

## Self-Check: PASSED

- src/components/InstructionsPanel.tsx — contains `import ReactMarkdown` and three ReactMarkdown usages
- src/index.css — contains `@plugin "@tailwindcss/typography"`
- Commits 4997a6c and a54a8a5 verified in git log
- No `whitespace-pre-line` remaining in InstructionsPanel.tsx
