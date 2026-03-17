export type { RootCauseOption } from './types/phase2'
import type { RootCauseOption } from './types/phase2'

export interface Case {
  id: string
  name: string
  type?: 'python' | 'yaml-config' // defaults to 'python' — 'yaml-config' skips Python worker
  difficulty:
    | 'rookie'
    | 'junior'
    | 'senior'
    | 'staff'
    | 'intermediate'
    | 'expert'
  concepts: string[]
  languages?: ('python' | 'javascript')[] // defaults to ['python']
  phase1: Phase1Config
  phase2?: Phase2Config
}

export interface Phase1Config {
  description: string
  hints: string[]
  initialCode: string
  initialCodeJs?: string // JavaScript equivalent of initialCode
  validations: ValidationRule[]
}

export interface Phase2Config {
  description: string
  investigationTools: ('traces' | 'logs' | 'metrics')[]
  rootCauseOptions?: RootCauseOption[]
}

export interface ValidationRule {
  type:
    | 'span_exists'
    | 'attribute_exists'
    | 'attribute_value'
    | 'span_count'
    | 'status_ok'
    | 'status_error'
    | 'telemetry_flowing'
    | 'error_handling'
    | 'yaml_key_exists' // NEW
  description: string
  successMessage: string
  errorMessage: string
  // Progressive hint messages for escalating guidance
  hintMessage?: string
  guidedMessage?: string
  // Optional params for specific validations
  spanName?: string
  attributeKey?: string
  attributeValue?: unknown
  minCount?: number
  yamlPath?: string // NEW: for yaml_key_exists
  expectedValue?: string // NEW: for yaml_key_exists
}

export interface ValidationResult extends ValidationRule {
  passed: boolean
  message: string
  attemptsOnThisRule: number
}
