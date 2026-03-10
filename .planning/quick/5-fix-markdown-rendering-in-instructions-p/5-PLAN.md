---
phase: quick-05
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - package.json
  - package-lock.json
  - src/index.css
  - src/components/InstructionsPanel.tsx
autonomous: true
requirements: [QUICK-05]
must_haves:
  truths:
    - "Phase 1 description renders bold text, headers, and lists from markdown syntax"
    - "Phase 2 description renders markdown when unlocked"
    - "Hints with backtick code snippets render inline code styled distinctly"
  artifacts:
    - path: "src/components/InstructionsPanel.tsx"
      provides: "ReactMarkdown rendering for descriptions and hints"
    - path: "src/index.css"
      provides: "@tailwindcss/typography plugin registration for prose classes"
  key_links:
    - from: "src/components/InstructionsPanel.tsx"
      to: "react-markdown"
      via: "import ReactMarkdown from 'react-markdown'"
    - from: "src/index.css"
      to: "@tailwindcss/typography"
      via: "@plugin directive"
---

<objective>
Fix markdown rendering in InstructionsPanel by replacing plain text divs with ReactMarkdown.

Purpose: Case YAML descriptions use markdown syntax (bold, headers, lists, inline code) that currently renders as raw characters. This makes instructions harder to read and parse.
Output: InstructionsPanel renders formatted markdown for phase1.description, phase2.description, and hint items.
</objective>

<execution_context>
@/Users/vasconcellos/.claude/get-shit-done/workflows/execute-plan.md
@/Users/vasconcellos/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md

@src/components/InstructionsPanel.tsx
</context>

<tasks>

<task type="auto">
  <name>Task 1: Install react-markdown and @tailwindcss/typography</name>
  <files>package.json, package-lock.json, src/index.css</files>
  <action>
    Run: npm install react-markdown @tailwindcss/typography

    Then add the typography plugin to src/index.css. This project uses Tailwind v4 (CSS-first config via @import "tailwindcss"). In v4, plugins are registered with @plugin directives, not in a tailwind.config.ts. Add the following line after the @import line at the top of src/index.css:

    ```css
    @plugin "@tailwindcss/typography";
    ```

    The file currently starts with:
    ```css
    @import "tailwindcss";

    @theme {
    ```

    After edit it should start with:
    ```css
    @import "tailwindcss";
    @plugin "@tailwindcss/typography";

    @theme {
    ```
  </action>
  <verify>
    <automated>grep "@plugin" /Users/vasconcellos/projetos/telemetry-academy/src/index.css && grep "react-markdown" /Users/vasconcellos/projetos/telemetry-academy/package.json && grep "tailwindcss/typography" /Users/vasconcellos/projetos/telemetry-academy/package.json</automated>
  </verify>
  <done>Both packages in package.json dependencies; @plugin directive present in index.css</done>
</task>

<task type="auto">
  <name>Task 2: Replace whitespace-pre-line divs with ReactMarkdown in InstructionsPanel</name>
  <files>src/components/InstructionsPanel.tsx</files>
  <action>
    Add import at top of file: `import ReactMarkdown from 'react-markdown';`

    Define a shared className constant near the top of the component (before the return) to avoid repetition:
    ```tsx
    const mdClass = "prose prose-invert prose-sm max-w-none prose-p:text-slate-400 prose-strong:text-slate-200 prose-code:text-sky-300 prose-code:bg-slate-800 prose-code:px-1 prose-code:rounded prose-headings:text-slate-200 prose-li:text-slate-400 prose-ul:my-1 prose-ol:my-1 prose-p:my-1";
    ```

    Make three replacements:

    1. Phase 1 description (line 54-58) — replace:
    ```tsx
    <div className="prose prose-invert prose-sm max-w-none">
      <div className="whitespace-pre-line text-slate-400 leading-relaxed">
        {caseData.phase1.description}
      </div>
    </div>
    ```
    with:
    ```tsx
    <ReactMarkdown className={mdClass}>
      {caseData.phase1.description}
    </ReactMarkdown>
    ```

    2. Phase 2 description (line 86-88) — replace:
    ```tsx
    <div className="whitespace-pre-line text-slate-400 text-sm">
      {caseData.phase2?.description || 'Investigation phase ready!'}
    </div>
    ```
    with:
    ```tsx
    <ReactMarkdown className={mdClass}>
      {caseData.phase2?.description || 'Investigation phase ready!'}
    </ReactMarkdown>
    ```

    3. Hint list items (line 67-71) — replace the hint text node:
    ```tsx
    <li key={index} className="flex items-start gap-2 text-sm text-slate-400">
      <span className="text-sky-400 font-mono">{index + 1}.</span>
      {hint}
    </li>
    ```
    with:
    ```tsx
    <li key={index} className="flex items-start gap-2 text-sm text-slate-400">
      <span className="text-sky-400 font-mono flex-shrink-0">{index + 1}.</span>
      <ReactMarkdown className="prose prose-invert prose-sm max-w-none prose-p:text-slate-400 prose-p:my-0 prose-code:text-sky-300 prose-code:bg-slate-800 prose-code:px-1 prose-code:rounded inline [&>p]:inline">
        {hint}
      </ReactMarkdown>
    </li>
    ```

    Note: The hint ReactMarkdown uses `prose-p:my-0` and `[&>p]:inline` to prevent the paragraph wrapper from adding line breaks inside the list item layout.
  </action>
  <verify>
    <automated>cd /Users/vasconcellos/projetos/telemetry-academy && npm run build 2>&1 | tail -20</automated>
  </verify>
  <done>Build succeeds with no TypeScript errors; InstructionsPanel.tsx imports ReactMarkdown and uses it in three locations</done>
</task>

</tasks>

<verification>
- `npm run build` exits 0 (TypeScript + Vite build passes)
- InstructionsPanel.tsx contains `import ReactMarkdown` and no remaining `whitespace-pre-line` divs for descriptions
- index.css contains `@plugin "@tailwindcss/typography"`
</verification>

<success_criteria>
- react-markdown and @tailwindcss/typography installed
- Phase 1 and Phase 2 descriptions render markdown (bold, lists, headers)
- Hints with backtick code render inline `code` styled with sky-300 on slate-800
- Build passes with no errors
</success_criteria>

<output>
After completion, create `.planning/quick/5-fix-markdown-rendering-in-instructions-p/5-SUMMARY.md`
</output>
