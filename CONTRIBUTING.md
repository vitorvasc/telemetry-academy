# Contributing to Telemetry Academy

Thanks for your interest! Telemetry Academy is an open source, browser-based OTel
learning platform. Contributions of all kinds are welcome — new cases, bug fixes,
UI improvements, and documentation.

## Getting Started

```bash
git clone https://github.com/vitorvasc/telemetry-academy.git
cd telemetry-academy
npm install
npm run dev        # http://localhost:5173
npm run build      # production build
npm run lint       # ESLint check
```

## Development Workflow (GSD)

This project uses the **GSD (Get Shit Done)** workflow for structured development.
All non-trivial changes follow this cycle:

```
Research → .planning/XX-YY-RESEARCH.md
Context  → .planning/XX-YY-CONTEXT.md   (decisions, gray areas)
Plan     → .planning/XX-YY-PLAN.md      (tasks + acceptance criteria)
Execute  → commit per task: feat(XX-YY): description
Verify   → .planning/XX-YY-VERIFICATION.md
```

Planning artifacts live in `.planning/`. Phase scope is fixed once `CONTEXT.md`
is approved — new ideas go in a `DEFERRED IDEAS` section.

For day-to-day contributions (bug fixes, case authoring), you don't need the full
GSD cycle. A clear PR description with before/after behavior is enough.

## Adding Cases

The fastest way to contribute is to author a new case. See [docs/adding_cases.md](docs/adding_cases.md)
for the full guide. The short version:

1. Create `src/cases/<id>/case.yaml` and `src/cases/<id>/setup.py`
2. Add Phase 2 data to `src/data/phase2.ts`
3. Cases are auto-discovered — no registration needed

## Commit Conventions

This project follows [Conventional Commits](https://www.conventionalcommits.org/):

```
feat(XX-YY): add context propagation case
fix(XX-YY): clear validation state on code change
chore: update dependencies
docs: improve contributing guide
```

Where `XX-YY` is the phase/task number (e.g., `04-01`). For standalone fixes or
case contributions, a simple `feat:` or `fix:` prefix is fine.

## Code Standards

- **TypeScript strict** — no `any`, no implicit returns
- **ESLint** — run `npm run lint` before pushing; CI will fail otherwise
- **Tailwind v4** — use utility classes; no inline styles
- **Pyodide patterns** — always set a 5s timeout in the Web Worker
- **Validation rules** — declarative JSON only; reference real span attribute names

## Pull Request Guidelines

- Keep PRs focused — one feature or fix per PR
- Reference the case ID or issue in the PR title if applicable
- For new cases: include a short description of the OTel concept being taught
- Screenshots or screen recordings welcome for UI changes
- All CI checks must pass (TypeScript build + ESLint)

## Project Structure

See [README.md](README.md) for the full directory layout and architecture overview.

## Questions?

Open an issue or start a discussion on GitHub.
