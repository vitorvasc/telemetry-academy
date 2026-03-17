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
npm run lint       # ESLint check (0 errors required)
npm run test       # unit tests
```

## Branch Strategy

- `main` — protected, always deployable. Direct pushes are blocked.
- Feature branches: `feat/<description>`, `fix/<description>`, `chore/<description>`
- Open a PR to merge into `main`. CI must pass before merging.

## Adding Cases

The fastest way to contribute is to author a new case. See [docs/ADDING_CASES.md](docs/ADDING_CASES.md)
for the full guide. The short version:

1. Create `src/cases/<id>/case.yaml` — content, validations, root cause options
2. Create `src/cases/<id>/setup.py` — initial Python code
3. Optionally add `src/cases/<id>/setup.js` for JavaScript support
4. Cases are auto-discovered at build time — no TypeScript changes needed

Use the [new case issue template](.github/ISSUE_TEMPLATE/new_case.md) to propose a case before implementing.

## Commit Conventions

This project follows [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add JavaScript support for Hello Span case
fix: clear validation state on code change
chore: update dependencies
docs: improve contributing guide
test: add unit tests for rootCauseEngine
```

## Code Standards

- **TypeScript strict** — `npm run build` must pass with no TS errors
- **ESLint** — `npm run lint` must report 0 errors before pushing
- **Tailwind v4** — use utility classes; no inline styles
- **No `any` escapes** — use `unknown` + type guards or targeted `eslint-disable` with a comment
- **Validation rules** — declarative JSON only; reference real span attribute names

## Pull Request Guidelines

1. Fork the repo and create a branch from `main`
2. Make your changes, ensuring `npm run build` and `npm run lint` pass
3. Open a PR using the [PR template](.github/pull_request_template.md)
4. CI will run TypeScript check + lint + build automatically
5. At least one review is required before merging

Keep PRs focused — one feature or fix per PR. For new cases, include a short
description of the OTel concept being taught. Screenshots or recordings welcome
for UI changes.

## Reporting Bugs & Security Issues

- **Bugs:** Open a [bug report](.github/ISSUE_TEMPLATE/bug_report.md)
- **Security:** See [SECURITY.md](SECURITY.md) — please do **not** open public issues for vulnerabilities

## Project Structure

See [README.md](README.md) for the full directory layout and architecture overview.

## Questions?

Open an issue or start a discussion on GitHub.
