---
name: new-case
description: |
  Author a new Telemetry Academy case from scratch. Guides through YAML
  definition, setup.py starter code, validation rules, phase 2 investigation
  data, and root cause rules. Use when creating any new learning case.
---

# New Case Authoring Workflow

You are authoring a complete Telemetry Academy case. Follow each step in order.
Do not skip steps — each one gates the next.

## Step 1: Gather Requirements

Ask for (or confirm from context):
- **Case concept**: What OTel feature does this case teach? (e.g., "context propagation")
- **Difficulty**: `rookie`, `intermediate`, or `advanced`
- **Learning goal**: One sentence — what will the user understand after solving this?
- **OTel API**: Which specific API/SDK feature is the Phase 1 instrumentation target?
- **Incident scenario**: What production problem does Phase 2 investigate?

Do NOT proceed to Step 2 until all 5 are confirmed.

## Step 2: Generate Case ID

Format: `<slug>-<NNN>` where slug = 3-4 word kebab-case concept name, NNN = next available number.

Check existing cases:
```
ls src/cases/
```

Examples: `hello-span-001`, `auto-magic-002`, `context-prop-003`

## Step 3: Create case.yaml

File path: `src/cases/<id>/case.yaml`

Required structure (reference `src/cases/hello-span-001/case.yaml`):

```yaml
id: <id>
name: "<Human-readable title>"
order: <next integer>
difficulty: <rookie|intermediate|advanced>
concepts:
  - <concept_slug>

phase1:
  description: |
    <Situation + Mission + Key Concepts + numbered Hints>
  hints:
    - "<hint 1>"
    - "<hint 2>"
    - "<hint 3>"
  validations:
    - type: <ValidationCheckType>
      description: "<what is being checked>"
      successMessage: "✓ <success>"
      errorMessage: "✗ <failure with fix suggestion>"
      hintMessage: "💡 Hint: <specific hint>"
      guidedMessage: "📖 <exact code or step>"

phase2:
  description: |
    <Investigation context — what the user sees in traces/logs>
  investigationTools:
    - traces
    - logs
  rootCauseOptions:
    - id: a
      label: "<distractor A>"
      correct: false
      explanation: "<why wrong, referencing specific span attributes>"
    - id: b
      label: "<correct answer>"
      correct: true
      explanation: "✓ <why correct, referencing specific span data>"
    - id: c
      label: "<distractor C>"
      correct: false
      explanation: "<why wrong>"
    - id: d
      label: "<distractor D>"
      correct: false
      explanation: "<why wrong>"
```

**Validation rule types** (must use exact strings from `src/lib/validation.ts`):
`span_exists`, `attribute_exists`, `attribute_value`, `span_count`,
`status_ok`, `status_error`, `telemetry_flowing`, `error_handling`

## Step 4: Create setup.py

File path: `src/cases/<id>/setup.py`

This is the **partial code** the user starts with. Rules:
- Include all boilerplate (imports, tracer setup, SDK config)
- Leave out exactly what the user needs to add (the learning target)
- Add `# TODO:` comment where instrumentation should go
- Include realistic business logic (not toy code)
- Keep it under 50 lines

Reference: `src/cases/hello-span-001/setup.py`

## Step 5: Add Phase 2 Data to phase2.ts

File: `src/data/phase2.ts`

Add a new entry to the `phase2Cases` object. Required structure:

```typescript
'<id>': {
  traces: [
    {
      traceId: '<generate-realistic-hex-id>',
      spans: [
        {
          spanId: '<hex>',
          parentSpanId: null,
          name: '<root-span-name>',
          startTime: 0,
          duration: <ms>,
          status: 'OK' | 'ERROR',
          attributes: {
            '<key>': '<value>',
            // Include the key diagnostic attribute (the one that reveals root cause)
          }
        },
        // child spans...
      ]
    }
  ],
  logs: [
    {
      timestamp: '<ISO string>',
      level: 'INFO' | 'WARN' | 'ERROR',
      message: '<realistic log line>',
      traceId: '<matching traceId>',
    }
  ],
  evaluationRules: [
    {
      optionId: '<a|b|c|d>',
      condition: {
        type: 'attribute_check',
        spanName: '<span name>',
        attributeKey: '<attribute key>',
        // Include a rule that definitively points to the correct answer
      },
      feedback: '<specific feedback referencing the actual attribute value>'
    }
  ]
}
```

**Critical:** The diagnostic attribute must be present in the traces AND
referenced in the correct root cause option's explanation AND in evaluationRules.

## Step 6: Verify Integration

Run these checks before declaring done:

1. Does `caseLoader.ts` discover the new case?
   - Confirm `src/cases/<id>/case.yaml` exists with correct `id:` field
2. Are all validation `type:` values valid `ValidationCheckType` strings?
   - Compare against `src/lib/validation.ts` export
3. Do root cause explanations reference real attribute names from traces?
   - Each `explanation` should name the specific span and attribute
4. Does `phase2.ts` data match the investigation scenario described in `case.yaml`?
5. Does `setup.py` leave exactly the right gap for the user to fill?

Run: `npm run dev` and load the case in browser to confirm no console errors.

## Step 7: Update sitemap.xml

File: `public/sitemap.xml`

Add the new case URL to the sitemap so Google indexes it:

```xml
<url>
  <loc>https://telemetry.academy/case/<id></loc>
  <lastmod>YYYY-MM-DD</lastmod>
  <changefreq>monthly</changefreq>
  <priority>0.8</priority>
</url>
```

Use today's date for `lastmod`. Place it after the last existing `<url>` block, before `</urlset>`.
