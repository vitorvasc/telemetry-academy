---
phase: quick-7
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/components/HomePage.tsx
autonomous: true
requirements: []
must_haves:
  truths:
    - "Hero heading reads noticeably larger on 2K (2560×1440) than on 1080p"
    - "Case card names and descriptions are comfortably readable without squinting on 2K"
    - "Navbar and sidebar labels scale up at xl/2xl breakpoints"
    - "No layout breakage at any intermediate width (1280px, 1440px, 1920px, 2560px)"
  artifacts:
    - path: "src/components/HomePage.tsx"
      provides: "Responsive font sizes with xl: and 2xl: prefixes"
  key_links:
    - from: "src/components/HomePage.tsx"
      to: "Tailwind v4 responsive prefixes"
      via: "xl: and 2xl: utility classes"
      pattern: "xl:text-|2xl:text-"
---

<objective>
Improve font size scaling on 2K (2560×1440) monitors throughout the HomePage component.

Purpose: At 2560×1440 the layout stretches wide but text stays pinned to small fixed
sizes (`text-[9px]`, `text-[10px]`, `text-xs`). Adding responsive Tailwind prefixes
(`xl:`, `2xl:`) makes the typography scale gracefully with viewport width.

Output: Updated `src/components/HomePage.tsx` with responsive font-size classes at
xl (≥1280px) and 2xl (≥1536px) breakpoints. No layout changes — typography only.
</objective>

<execution_context>
@/Users/vasconcellos/.claude/get-shit-done/workflows/execute-plan.md
@/Users/vasconcellos/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md

Tailwind version: v4 (CSS-first, `@import "tailwindcss"` in src/index.css — no tailwind.config.js).
Standard breakpoints apply: sm(640) md(768) lg(1024) xl(1280) 2xl(1536).
The 2K monitor is 2560×1440, well past the 2xl breakpoint at 1536px.
</context>

<tasks>

<task type="auto">
  <name>Task 1: Scale HomePage typography at xl and 2xl breakpoints</name>
  <files>src/components/HomePage.tsx</files>
  <action>
Apply responsive font-size upgrades throughout `src/components/HomePage.tsx`.
Do NOT change layout, spacing, colors, or component structure — typography only.

Specific changes to make (current → xl → 2xl):

**Navbar (header)**
- Logo text `text-sm` → `xl:text-base 2xl:text-lg`
- Stats bar `text-[11px]` → `xl:text-xs 2xl:text-sm`

**Hero section**
- `h1` heading `text-2xl sm:text-3xl` → add `xl:text-4xl 2xl:text-5xl`
- Subtitle paragraph `text-sm` → `xl:text-base 2xl:text-lg`
- "How it works" teaser `text-xs` → `xl:text-sm 2xl:text-base`
- Stat value `text-xl` inside the stats grid → `xl:text-2xl 2xl:text-3xl`
- Stat label `text-[9px]` → `xl:text-[10px] 2xl:text-xs`

**Incidents section header**
- Section label `text-xs` → `xl:text-sm`
- Cleared counter `text-xs` → `xl:text-sm`

**Case cards**
- Case name `text-sm` → `xl:text-base`
- Difficulty/status badge `text-[10px]` → `xl:text-xs`
- Concept tag `text-[10px]` → `xl:text-xs`
- Description `text-xs` → `xl:text-sm`
- CTA button text `text-xs` → `xl:text-sm`

**CaseList sidebar (desktop)**
- Clearance label `text-[10px]` → `xl:text-xs`
- Case name in list `text-xs` → `xl:text-sm`

Keep all existing classes intact; only APPEND responsive variants.
Example: `text-xs` becomes `text-xs xl:text-sm` (keep original, add prefix).
  </action>
  <verify>
    <automated>npx tsc --noEmit 2>&1 | head -20</automated>
  </verify>
  <done>
TypeScript compiles without errors. Every font-size class that was previously a bare
fixed size now has at least an `xl:` variant appended. At viewport width ≥1280px text
is visibly larger than at 1024px.
  </done>
</task>

</tasks>

<verification>
After completing the task:
1. Run `npx tsc --noEmit` — must exit 0
2. Run `npm run dev`, open browser at http://localhost:5173
3. Use DevTools device toolbar to set width to 2560px — verify hero heading, case
   names, and navbar labels are comfortably larger than at 1024px width
4. Set width back to 768px — verify nothing looks broken on tablet
</verification>

<success_criteria>
- TypeScript build passes (zero new errors)
- At 2560px viewport: hero h1 is ≥ text-5xl equivalent, case names are ≥ text-base,
  navbar logo text is ≥ text-lg
- At 768px and below: layout identical to before this change
</success_criteria>

<output>
After completion, create `.planning/quick/7-fix-font-size-scaling-on-2k-resolution-e/7-SUMMARY.md`
with what changed, files modified, and the commit hash.
</output>
