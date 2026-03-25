# Contributing to Telemetry Academy

Thanks for your interest! Telemetry Academy is an open source, browser-based OTel learning platform. Contributions of all kinds are welcome — new cases, bug fixes, UI improvements, and documentation.

## Getting Started

```bash
git clone https://github.com/vitorvasc/telemetry-academy.git
cd telemetry-academy
npm install
npm run dev        # http://localhost:5173
npm run build      # production build
npm run lint       # ESLint check
npm run test       # unit tests
```

## How to Contribute

### Reporting a bug

Use the [bug report template](.github/ISSUE_TEMPLATE/bug_report.md) — include browser, OS, and which case/language you were using.

### Proposing a new case

Use the [new case template](.github/ISSUE_TEMPLATE/new_case.md). Cases are the heart of the project — great proposals include a clear OTel concept, a realistic incident scenario, and a well-defined root cause.

### Opening a PR

1. Fork the repo and create a branch: `git checkout -b feat/your-feature`
2. Make your changes
3. Ensure `npm run build` and `npm run lint` pass with 0 errors
4. Open a PR against `main` — fill in the PR template

All PRs run CI automatically (build + lint). The `main` branch is protected and requires a passing CI check before merge.

## Adding a New Case

Cases live in `src/cases/<id>/` and are auto-discovered at build time. No TypeScript changes needed.

```
src/cases/my-new-case/
├── case.yaml   # content, validations, root cause options
├── setup.py    # Python starter code
└── setup.js    # JavaScript starter code (optional)
```

See [docs/ADDING_CASES.md](docs/ADDING_CASES.md) for the full schema reference and examples.

## Development Workflow

This project uses a structured planning workflow for larger features. Planning artifacts live in `.planning/` and are not required for small contributions.

For substantial changes (new phases, architecture changes), open an issue first to discuss the approach before writing code.

## Code Style

- TypeScript strict mode — all files must pass `tsc --noEmit`
- ESLint with `@typescript-eslint/recommended-type-checked` — 0 errors required
- Conventional commits: `feat:`, `fix:`, `docs:`, `chore:`, `refactor:`
- Commits are signed (`git commit -s`)

## Issue Labels

We use a standardized set of labels to categorize issues and PRs.

### Priority

| Label | Meaning |
|-------|---------|
| `critical` | P0 — must fix before any deploy |
| `high` | P1 — fix in current sprint |
| `medium` | P2 — fix in next sprint |
| `low` | P3 — nice to have |

### Type

| Label | Meaning |
|-------|---------|
| `fix` | Bug fix |
| `feat` | New feature |
| `ux` | User experience improvement |
| `chore` | Maintenance, cleanup, tooling |
| `docs` | Documentation |
| `perf` | Performance improvement |
| `security` | Security-related issue |
| `analytics` | Analytics & tracking |
| `content` | Case content, curriculum |

### Other

| Label | Meaning |
|-------|---------|
| `good first issue` | Good for newcomers |
| `dependencies` | Dependency updates (Dependabot) |

When opening an issue, apply at least one **priority** label and one **type** label.

---

## License

By contributing, you agree your contributions are licensed under the [MIT License](LICENSE).
