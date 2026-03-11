---
phase: quick-7
plan: "01"
subsystem: ui
tags: [responsive, typography, tailwind, homepage]
dependency_graph:
  requires: []
  provides: [responsive-typography-2k]
  affects: [src/components/HomePage.tsx]
tech_stack:
  added: []
  patterns: [tailwind-responsive-prefixes, xl-2xl-breakpoints]
key_files:
  created: []
  modified:
    - src/components/HomePage.tsx
decisions:
  - "Only append responsive variants; never remove base classes (mobile-first preserved)"
  - "xl: used for 1280px+ scaling; 2xl: used for 1536px+ scaling (covers 2560x1440)"
  - "Sidebar CaseList only gets xl: variants (not 2xl:) — sidebar width stays fixed at w-56"
metrics:
  duration: "2 min"
  completed: "2026-03-11"
  tasks: 1
  files: 1
---

# Phase quick-7 Plan 01: Fix Font Size Scaling on 2K Resolution Summary

Responsive Tailwind typography added to all HomePage text elements using xl: and 2xl: breakpoint prefixes so text scales gracefully from 1024px up to 2560x1440.

## What Changed

All font-size classes in `src/components/HomePage.tsx` that were previously fixed received responsive xl: and 2xl: variants appended. No layout, spacing, colors, or component structure was touched — typography only.

### Navbar

| Element | Before | After |
|---------|--------|-------|
| Logo text | `text-sm` | `text-sm xl:text-base 2xl:text-lg` |
| Stats bar | `text-[11px]` | `text-[11px] xl:text-xs 2xl:text-sm` |

### Hero section

| Element | Before | After |
|---------|--------|-------|
| h1 heading | `text-2xl sm:text-3xl` | `text-2xl sm:text-3xl xl:text-4xl 2xl:text-5xl` |
| Subtitle paragraph | `text-sm` | `text-sm xl:text-base 2xl:text-lg` |
| "How it works" teaser | `text-xs` | `text-xs xl:text-sm 2xl:text-base` |
| Stat value | `text-xl` | `text-xl xl:text-2xl 2xl:text-3xl` |
| Stat label | `text-[9px]` | `text-[9px] xl:text-[10px] 2xl:text-xs` |

### Incidents section header

| Element | Before | After |
|---------|--------|-------|
| Section label | `text-xs` | `text-xs xl:text-sm` |
| Cleared counter | `text-xs` | `text-xs xl:text-sm` |

### Case cards

| Element | Before | After |
|---------|--------|-------|
| Case name | `text-sm` | `text-sm xl:text-base` |
| Difficulty badge | `text-[10px]` | `text-[10px] xl:text-xs` |
| "Cleared" badge | `text-[10px]` | `text-[10px] xl:text-xs` |
| Concept tag | `text-[10px]` | `text-[10px] xl:text-xs` |
| Description | `text-xs` | `text-xs xl:text-sm` |
| CTA button | `text-xs` | `text-xs xl:text-sm` |

### CaseList sidebar (desktop)

| Element | Before | After |
|---------|--------|-------|
| Clearance label | `text-[10px]` | `text-[10px] xl:text-xs` |
| Clearance counter | `text-[10px]` | `text-[10px] xl:text-xs` |
| Case name in list | `text-xs` | `text-xs xl:text-sm` |

## Verification

- `npx tsc --noEmit` — exits 0, zero errors
- All modified classes retain original base size (mobile-first approach preserved)
- xl: variants activate at 1280px+, 2xl: variants activate at 1536px+
- 2K (2560x1440) is comfortably past the 2xl threshold

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| Task 1 | f0091f3 | feat(quick-7): scale HomePage typography at xl and 2xl breakpoints |

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check: PASSED

- `src/components/HomePage.tsx` modified: FOUND
- Commit f0091f3: FOUND
- TypeScript build: PASSED (zero errors)
