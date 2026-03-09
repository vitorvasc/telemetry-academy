---
description: Show completion status for all Telemetry Academy cases
allowed-tools: Bash, Read, Glob
---

# Case Status Dashboard

Show the completion state of every case in the project.

## Steps

### 1. Discover All Cases

```bash
ls src/cases/
```

### 2. For Each Case Directory

Read `src/cases/<id>/case.yaml` and check:
- `id` field present
- `name` field present
- `difficulty` field present
- `phase1.validations` count
- `phase2.rootCauseOptions` count (and which is correct)
- Any `FILL IN` placeholder text remaining (indicates incomplete authoring)

Check if `src/cases/<id>/setup.py` exists.

### 3. Check Phase 2 Data

Read `src/data/phase2.ts` and check which case IDs have entries:
- Has traces array (non-empty)
- Has logs array (non-empty)
- Has evaluationRules array (non-empty)

### 4. Output Dashboard

```
TELEMETRY ACADEMY — CASE STATUS
================================
Generated: <date>

ID                  NAME                      DIFF        PH1 RULES  PH2 DATA  SETUP.PY  STATUS
----                ----                      ----        ---------  --------  --------  ------
hello-span-001      Hello, Span               rookie      3 rules    ✓          ✓         COMPLETE
auto-magic-002      Auto-Magic                rookie      3 rules    ✓          ✓         COMPLETE
context-prop-003    Context Propagation        intermediate  0 rules  ✗          ✗         SCAFFOLD ONLY
<new-id>            FILL IN: title            -           -          -          -         INCOMPLETE (placeholders)

SUMMARY
-------
Complete:        2 / 9
Scaffold only:   1 / 9
Incomplete:      1 / 9
Not started:     5 / 9

NEXT CASE TO AUTHOR: <first not-started case from roadmap>
```

### 5. Show Roadmap Gap

Read `.planning/ROADMAP.md` for the planned case list.
Cross-reference with discovered cases to show which planned cases haven't been started.

```
PLANNED BUT NOT STARTED (from ROADMAP.md):
  - The Collector (collector pipeline)
  - Baggage Claim (OTel baggage API)
  - Needle in a Haystack (context propagation)
  - Red Alert (error spans + status codes)
  - Sampling Safari (head/tail sampling)
  - The Missing Link (log correlation)
  - Advanced Ops (complex multi-service)
```
