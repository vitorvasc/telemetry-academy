import yaml from 'js-yaml'
import type { RawOTelSpan } from '../hooks/usePhase2Data'

export type ValidationCheckType =
  | 'span_exists'
  | 'attribute_exists'
  | 'attribute_value'
  | 'span_count'
  | 'status_ok'
  | 'status_error'
  | 'telemetry_flowing'
  | 'error_handling'
  | 'yaml_key_exists' // NEW: checks YAML structure, used for The Collector case

export interface SpanValidationRule {
  type: ValidationCheckType
  spanName?: string
  attributeKey?: string
  attributeValue?: unknown
  minCount?: number
  description: string
  successMessage: string
  errorMessage: string
  hintMessage?: string
  guidedMessage?: string
  // YAML validation fields (used when type === 'yaml_key_exists')
  yamlPath?: string // dot-notation path: 'processors.tail_sampling'
  expectedValue?: string // optional: check that value equals this string
}

export interface ValidationContext {
  spans: RawOTelSpan[]
  attemptHistory: Record<string, number> // rule description -> attempt count
}

export interface YamlValidationContext {
  yamlContent: string
  attemptHistory: Record<string, number>
}

export interface ValidationResult extends SpanValidationRule {
  passed: boolean
  message: string
  attemptsOnThisRule: number
}

/**
 * Validates captured spans against a set of validation rules.
 * Returns results with progressive hint escalation based on attempt history.
 */
export function validateSpans(
  rules: SpanValidationRule[],
  context: ValidationContext
): ValidationResult[] {
  return rules.map(rule => {
    const attempts = context.attemptHistory[rule.description] || 0
    const passed = runCheck(rule, context.spans)
    const message = selectMessage(rule, attempts, passed)

    return {
      ...rule,
      passed,
      message,
      attemptsOnThisRule: attempts,
    }
  })
}

/**
 * Runs the appropriate check based on rule type.
 */
function runCheck(rule: SpanValidationRule, spans: RawOTelSpan[]): boolean {
  switch (rule.type) {
    case 'span_exists':
      return checkSpanExists(spans, rule.spanName)
    case 'attribute_exists':
      return checkAttributeExists(spans, rule.spanName, rule.attributeKey)
    case 'attribute_value':
      return checkAttributeValue(
        spans,
        rule.spanName,
        rule.attributeKey,
        rule.attributeValue
      )
    case 'span_count':
      return checkSpanCount(spans, rule.minCount)
    case 'status_ok':
      return checkStatus(spans, rule.spanName, 'OK')
    case 'status_error':
      return checkStatus(spans, rule.spanName, 'ERROR')
    case 'telemetry_flowing':
      // Check that spans exist (telemetry is flowing) and span name matches if specified
      return checkSpanExists(spans, rule.spanName) && spans.length > 0
    case 'error_handling':
      // Check for error status or error attributes in spans
      return spans.some(span => {
        const status = (span.status as Record<string, unknown>) || {}
        const attributes = span.attributes || {}
        const hasErrorStatus =
          (status['status_code'] || status['code']) === 'ERROR'
        const hasErrorAttributes =
          'error.type' in attributes || 'error.message' in attributes
        return hasErrorStatus || hasErrorAttributes
      })
    case 'yaml_key_exists':
      return false // Handled by validateYaml, not validateSpans
    default:
      return false
  }
}

/**
 * Selects the appropriate message based on attempt count and pass/fail status.
 * Progressive escalation: error -> hint -> guided
 */
function selectMessage(
  rule: SpanValidationRule,
  attempts: number,
  passed: boolean
): string {
  if (passed) {
    return rule.successMessage
  }

  if (attempts === 0) {
    return rule.errorMessage
  } else if (attempts >= 1 && attempts <= 2) {
    return rule.hintMessage || rule.errorMessage
  } else {
    return rule.guidedMessage || rule.hintMessage || rule.errorMessage
  }
}

/**
 * Checks if a span with the given name exists.
 * If no name is provided, checks if any spans exist.
 */
export function checkSpanExists(
  spans: RawOTelSpan[],
  spanName?: string
): boolean {
  if (!spans || spans.length === 0) {
    return false
  }

  if (!spanName) {
    return spans.length > 0
  }

  return spans.some(span => span.name === spanName)
}

/**
 * Checks if an attribute exists on a span (or any span if no spanName).
 * Looks in span.attributes object per OpenTelemetry structure.
 */
export function checkAttributeExists(
  spans: RawOTelSpan[],
  spanName?: string,
  attributeKey?: string
): boolean {
  if (!spans || spans.length === 0 || !attributeKey) {
    return false
  }

  const spansToCheck = spanName
    ? spans.filter(span => span.name === spanName)
    : spans

  return spansToCheck.some(span => {
    const attributes = span.attributes || {}
    return attributeKey in attributes
  })
}

/**
 * Checks if an attribute has a specific value.
 */
export function checkAttributeValue(
  spans: RawOTelSpan[],
  spanName?: string,
  attributeKey?: string,
  attributeValue?: unknown
): boolean {
  if (
    !spans ||
    spans.length === 0 ||
    !attributeKey ||
    attributeValue === undefined
  ) {
    return false
  }

  const spansToCheck = spanName
    ? spans.filter(span => span.name === spanName)
    : spans

  return spansToCheck.some(span => {
    const attributes = span.attributes || {}
    const actual = attributes[attributeKey]
    // Compare as strings to handle type mismatches between rule definitions
    // (e.g. number 200) and span attributes (stored as string "200" after
    // normalizeAttributes). Strict equality is tried first for exact matches.
    return actual === attributeValue || String(actual) === String(attributeValue)
  })
}

/**
 * Checks if the number of spans meets the minimum count.
 */
export function checkSpanCount(
  spans: RawOTelSpan[],
  minCount?: number
): boolean {
  if (minCount === undefined) {
    return spans && spans.length > 0
  }
  return (spans?.length || 0) >= minCount
}

/**
 * Checks if a span (or any span) has a specific status code.
 * Checks status.status_code field per OpenTelemetry structure.
 */
export function checkStatus(
  spans: RawOTelSpan[],
  spanName?: string,
  statusCode?: string
): boolean {
  if (!spans || spans.length === 0) {
    return false
  }

  const spansToCheck = spanName
    ? spans.filter(span => span.name === spanName)
    : spans

  return spansToCheck.some(span => {
    const status = (span.status as Record<string, unknown>) || {}
    const actualStatusCode = status['status_code'] || status['code']
    return actualStatusCode === statusCode
  })
}

/**
 * Validates a YAML string against yaml_key_exists rules.
 * Used for The Collector case — no Python worker involved.
 */
export function validateYaml(
  rules: SpanValidationRule[],
  context: YamlValidationContext
): ValidationResult[] {
  // Pre-validate YAML syntax before running rules.
  // Return a single synthetic error result if the YAML is malformed,
  // so students get actionable feedback instead of silent failures.
  try {
    yaml.load(context.yamlContent)
  } catch (err: unknown) {
    const detail = err instanceof Error ? err.message : String(err)
    return rules.map(rule => ({
      ...rule,
      passed: false,
      message: `✗ Invalid YAML syntax: ${detail}`,
      attemptsOnThisRule: context.attemptHistory[rule.description] || 0,
    }))
  }

  return rules.map(rule => {
    const attempts = context.attemptHistory[rule.description] || 0
    const passed =
      rule.type === 'yaml_key_exists'
        ? checkYamlKeyExists(
            context.yamlContent,
            rule.yamlPath,
            rule.expectedValue
          )
        : false
    const message = selectMessage(rule, attempts, passed)
    return {
      ...rule,
      passed,
      message,
      attemptsOnThisRule: attempts,
    }
  })
}

/**
 * Checks if a dot-notation path exists in a parsed YAML document.
 * Optionally checks that the value equals expectedValue.
 */
function checkYamlKeyExists(
  yamlContent: string,
  path?: string,
  expectedValue?: string
): boolean {
  if (!path) return false
  try {
    const doc = yaml.load(yamlContent) as Record<string, unknown>
    if (!doc || typeof doc !== 'object') return false
    const keys = path.split('.')
    let current: unknown = doc
    for (const key of keys) {
      if (
        current === null ||
        typeof current !== 'object' ||
        !(key in current)
      ) {
        return false
      }
      current = (current as Record<string, unknown>)[key]
    }
    if (expectedValue !== undefined) {
      return String(current) === String(expectedValue)
    }
    return true
  } catch {
    return false // Invalid YAML — treat as failed
  }
}
