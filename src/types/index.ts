// ─── Field Kinds ───────────────────────────────────────────────────────────────
export type FieldKind =
  | 'single_line'
  | 'multi_line'
  | 'number'
  | 'date'
  | 'single_select'
  | 'multi_select'
  | 'file_upload'
  | 'section_header'
  | 'calculation'

// ─── Field Configs (discriminated union) ──────────────────────────────────────
interface FieldConfigBase {
  id: string
  kind: FieldKind
  label: string
  required: boolean
  hint?: string
}

export interface SingleLineConfig extends FieldConfigBase {
  kind: 'single_line'
  placeholder?: string
  maxLength?: number
}

export interface MultiLineConfig extends FieldConfigBase {
  kind: 'multi_line'
  placeholder?: string
  rows?: number
}

export interface NumberConfig extends FieldConfigBase {
  kind: 'number'
  placeholder?: string
  min?: number
  max?: number
  decimalPlaces?: number
}

export interface DateConfig extends FieldConfigBase {
  kind: 'date'
  prefillToday: boolean
}

export type SelectOption = { id: string; label: string }
export type SingleSelectDisplayType = 'radio' | 'dropdown' | 'tiles'

export interface SingleSelectConfig extends FieldConfigBase {
  kind: 'single_select'
  options: SelectOption[]
  displayType: SingleSelectDisplayType
}

export interface MultiSelectConfig extends FieldConfigBase {
  kind: 'multi_select'
  options: SelectOption[]
  minSelections?: number
  maxSelections?: number
}

export interface FileUploadConfig extends FieldConfigBase {
  kind: 'file_upload'
  acceptedTypes?: string[]
  maxFileSizeMB?: number
}

export interface SectionHeaderConfig extends FieldConfigBase {
  kind: 'section_header'
  size: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
  description?: string
}

export interface CalculationConfig extends FieldConfigBase {
  kind: 'calculation'
  sourceFieldIds: string[]
  operation: 'sum' | 'average' | 'minimum' | 'maximum'
  decimalPlaces?: number
}

export type FieldConfig =
  | SingleLineConfig
  | MultiLineConfig
  | NumberConfig
  | DateConfig
  | SingleSelectConfig
  | MultiSelectConfig
  | FileUploadConfig
  | SectionHeaderConfig
  | CalculationConfig

// ─── Conditions (doubly-discriminated) ────────────────────────────────────────
export type ConditionOperator =
  | 'equals' | 'not_equals'
  | 'contains' | 'not_contains'
  | 'greater_than' | 'less_than'
  | 'is_filled' | 'is_empty'
  | 'includes_option' | 'excludes_option'
  | 'before' | 'after'

export interface Condition {
  id: string
  targetFieldId: string
  operator: ConditionOperator
  value?: string | number
}

export type ConditionLogic = 'AND' | 'OR'

export interface ConditionalRule {
  logic: ConditionLogic
  conditions: Condition[]
}

// ─── Field Values (discriminated union mirroring configs) ─────────────────────
export type FieldValue =
  | { kind: 'single_line'; value: string }
  | { kind: 'multi_line'; value: string }
  | { kind: 'number'; value: number | null }
  | { kind: 'date'; value: string }
  | { kind: 'single_select'; value: string }
  | { kind: 'multi_select'; value: string[] }
  | { kind: 'file_upload'; value: FileMetadata[] }
  | { kind: 'section_header'; value: null }
  | { kind: 'calculation'; value: number | null }

export interface FileMetadata {
  name: string
  size: number
  type: string
  lastModified: number
}

// ─── Form Schema ───────────────────────────────────────────────────────────────
export interface FormSchema {
  id: string
  title: string
  description?: string
  fields: FieldConfig[]
  conditionalRules: Record<string, ConditionalRule>
  createdAt: string
  updatedAt: string
}

// ─── Form Response ─────────────────────────────────────────────────────────────
export interface FormResponse {
  id: string
  templateId: string
  schemaSnapshot: FormSchema
  values: Record<string, FieldValue>
  visibleFieldIds: string[]
  fieldLabelSnapshot: Record<string, string>
  submittedAt: string
}

// ─── Storage Types ─────────────────────────────────────────────────────────────
export interface StoredTemplate {
  schema: FormSchema
  responseCount: number
}

// ─── Visibility State ──────────────────────────────────────────────────────────
export type VisibilityState = Record<string, boolean>

// ─── Schema Errors ─────────────────────────────────────────────────────────────
export interface SchemaError {
  fieldId?: string
  message: string
}
