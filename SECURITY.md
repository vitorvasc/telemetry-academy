# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| latest (`main`) | ✅ |

## Reporting a Vulnerability

Please **do not** open a public GitHub issue for security vulnerabilities.

Instead, report them via GitHub's private vulnerability reporting:
👉 [Report a vulnerability](https://github.com/vitorvasc/telemetry-academy/security/advisories/new)

Or email: **security@vasconcellos.dev**

You can expect an acknowledgement within **48 hours** and a fix or mitigation plan within **7 days** for confirmed issues.

## Scope

**In scope:**
- XSS or code injection via user-submitted code escaping the Web Worker sandbox
- Data leakage between sessions (localStorage isolation)
- Supply chain vulnerabilities in production dependencies

**Out of scope:**
- Vulnerabilities in dev-only dependencies (not shipped to browsers)
- Self-XSS (the user executing their own code is by design)
- Rate limiting / DDoS (the site has no backend)

## Notes on the sandboxing model

User-submitted code runs inside a **Web Worker** (`js.worker.ts`, `python.worker.ts`) isolated from the main thread and DOM. This is the primary security boundary. If you find a way to escape this sandbox, please report it — that's a high-severity finding.
