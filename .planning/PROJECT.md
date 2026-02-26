# Telemetry Academy

## What This Is

A gamified learning platform for teaching OpenTelemetry. It combines zero-to-hero OpenTelemetry education with incident investigation gameplay, where users first instrument a "blind" system and then use the resulting telemetry data to investigate and find root causes.

## Core Value

A realistic, interactive, and gamified environment that mirrors real SRE workflows, making OpenTelemetry instrumentation and investigation accessible and hands-on.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Interactive code editor (Monaco Editor) with Python syntax support
- [ ] Case instructions and hints panel
- [ ] Validation mechanism for checking user's instrumentation code
- [ ] Phase unlock flow (unlock Phase 2 after Phase 1 validation passes)
- [ ] Real code execution environment for Python scripts
- [ ] Trace visualization component
- [ ] Phase 2 investigation UI (Log Search, Metrics Dashboard, Trace Explorer)

### Out of Scope

- [Full-fledged production observability backend] — Too complex; this is a learning platform so mock or simplified backends are sufficient for cases.
- [Mobile app] — Code editing and trace investigation requires a desktop screen size.

## Context

- Tech stack: React 19 + TypeScript + Vite + Tailwind CSS v4.
- Code editor is implemented using `@monaco-editor/react`.
- Currently, the project is a Phase 1 prototype (frontend mock) with a WIP for real code execution and trace visualization.
- Cases are defined in a YAML-like TypeScript format containing phase descriptions, initial code, and validations.

## Constraints

- **Tech Stack**: Must use React 19, TypeScript, Vite, and Tailwind CSS v4 to maintain consistency with the existing scaffold.
- **Client-Side/Simple Execution**: Real code execution might require a sandbox or backend, must be designed to be secure and reliable.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Using Monaco Editor | Industry standard for web-based code editing, provides robust syntax highlighting | — Pending |

---
*Last updated: 2026-02-26 after initialization*