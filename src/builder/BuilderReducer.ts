import type { FormSchema, FieldConfig, ConditionalRule, SchemaError } from '@/types'
import { getField } from '@/registry'

export interface BuilderState {
  schema: FormSchema
  selectedFieldId: string | null
  isDirty: boolean
  schemaErrors: SchemaError[]
}

function generateId(): string {
  return `field_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
}

function validateSchema(schema: FormSchema): SchemaError[] {
  const errors: SchemaError[] = []
  if (!schema.title.trim()) errors.push({ message: 'Form title is required' })
  for (const field of schema.fields) {
    if (field.kind === 'section_header') continue
    if (!field.label.trim()) errors.push({ fieldId: field.id, message: 'Field label is required' })
    if ((field.kind === 'single_select' || field.kind === 'multi_select') && field.options.length === 0) {
      errors.push({ fieldId: field.id, message: 'At least one option is required' })
    }
    if (field.kind === 'calculation' && field.sourceFieldIds.length === 0) {
      errors.push({ fieldId: field.id, message: 'Select at least one source field for calculation' })
    }
  }
  return errors
}

function cleanupOrphanedConditions(schema: FormSchema, removedFieldId: string): FormSchema {
  const newRules = { ...schema.conditionalRules }
  for (const fieldId of Object.keys(newRules)) {
    const rule = newRules[fieldId]
    const filtered = rule.conditions.filter(c => c.targetFieldId !== removedFieldId)
    if (filtered.length !== rule.conditions.length) {
      newRules[fieldId] = { ...rule, conditions: filtered }
    }
    if (newRules[fieldId].conditions.length === 0) {
      delete newRules[fieldId]
    }
  }
  return { ...schema, conditionalRules: newRules }
}

export type BuilderAction =
  | { type: 'FIELD_ADD'; kind: FieldConfig['kind'] }
  | { type: 'FIELD_UPDATE'; config: FieldConfig }
  | { type: 'FIELD_DELETE'; fieldId: string }
  | { type: 'FIELD_REORDER'; fromIndex: number; toIndex: number }
  | { type: 'FIELD_SELECT'; fieldId: string | null }
  | { type: 'FORM_UPDATE'; title: string; description?: string }
  | { type: 'RULE_UPDATE'; fieldId: string; rule: ConditionalRule }
  | { type: 'RULE_DELETE'; fieldId: string }
  | { type: 'SAVE_SUCCESS' }
  | { type: 'LOAD_SCHEMA'; schema: FormSchema }

export function builderReducer(state: BuilderState, action: BuilderAction): BuilderState {
  switch (action.type) {
    case 'LOAD_SCHEMA': {
      return { ...state, schema: action.schema, isDirty: false, schemaErrors: validateSchema(action.schema), selectedFieldId: null }
    }

    case 'FIELD_ADD': {
      const id = generateId()
      const reg = getField(action.kind)
      const newConfig = reg.createDefaultConfig(id)
      const fields = [...state.schema.fields, newConfig]
      const schema = { ...state.schema, fields, updatedAt: new Date().toISOString() }
      return { ...state, schema, selectedFieldId: id, isDirty: true, schemaErrors: validateSchema(schema) }
    }

    case 'FIELD_UPDATE': {
      const oldConfig = state.schema.fields.find(f => f.id === action.config.id)
      let schema = {
        ...state.schema,
        fields: state.schema.fields.map(f => f.id === action.config.id ? action.config : f),
        updatedAt: new Date().toISOString(),
      }
      if (oldConfig && oldConfig.kind !== action.config.kind) {
        schema = cleanupOrphanedConditions(schema, action.config.id)
      }
      return { ...state, schema, isDirty: true, schemaErrors: validateSchema(schema) }
    }

    case 'FIELD_DELETE': {
      let schema = {
        ...state.schema,
        fields: state.schema.fields.filter(f => f.id !== action.fieldId),
        updatedAt: new Date().toISOString(),
      }
      schema = cleanupOrphanedConditions(schema, action.fieldId)
      const newRules = { ...schema.conditionalRules }
      delete newRules[action.fieldId]
      schema = { ...schema, conditionalRules: newRules }
      const selectedFieldId = state.selectedFieldId === action.fieldId ? null : state.selectedFieldId
      return { ...state, schema, selectedFieldId, isDirty: true, schemaErrors: validateSchema(schema) }
    }

    case 'FIELD_REORDER': {
      const fields = [...state.schema.fields]
      const [moved] = fields.splice(action.fromIndex, 1)
      fields.splice(action.toIndex, 0, moved)
      const schema = { ...state.schema, fields, updatedAt: new Date().toISOString() }
      return { ...state, schema, isDirty: true, schemaErrors: validateSchema(schema) }
    }

    case 'FIELD_SELECT': {
      return { ...state, selectedFieldId: action.fieldId }
    }

    case 'FORM_UPDATE': {
      const schema = { ...state.schema, title: action.title, description: action.description, updatedAt: new Date().toISOString() }
      return { ...state, schema, isDirty: true, schemaErrors: validateSchema(schema) }
    }

    case 'RULE_UPDATE': {
      const schema = {
        ...state.schema,
        conditionalRules: { ...state.schema.conditionalRules, [action.fieldId]: action.rule },
        updatedAt: new Date().toISOString(),
      }
      return { ...state, schema, isDirty: true }
    }

    case 'RULE_DELETE': {
      const newRules = { ...state.schema.conditionalRules }
      delete newRules[action.fieldId]
      const schema = { ...state.schema, conditionalRules: newRules, updatedAt: new Date().toISOString() }
      return { ...state, schema, isDirty: true }
    }

    case 'SAVE_SUCCESS': {
      return { ...state, isDirty: false }
    }

    default:
      return state
  }
}

export function createInitialBuilderState(schema?: FormSchema): BuilderState {
  const defaultSchema: FormSchema = {
    id: `tmpl_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    title: 'Untitled Form',
    description: '',
    fields: [],
    conditionalRules: {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  const s = schema ?? defaultSchema
  return { schema: s, selectedFieldId: null, isDirty: false, schemaErrors: validateSchema(s) }
}
