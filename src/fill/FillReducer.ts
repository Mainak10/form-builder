// src/fill/FillReducer.ts
import type { FormSchema, FieldValue, FormResponse, VisibilityState } from '@/types'
import { getField, validateField } from '@/registry'
import { runConditionalLogicEngine } from '@/engines/conditionalLogicEngine'
import { runCalculationEngine } from '@/engines/calculationEngine'

export interface FillState {
  schema: FormSchema
  values: Record<string, FieldValue>
  touched: Record<string, boolean>
  isSubmitted: boolean
  errors: Record<string, string>
  visibility: VisibilityState
  savedResponse: FormResponse | null
}

export type FillAction =
  | { type: 'VALUE_CHANGE'; fieldId: string; value: FieldValue }
  | { type: 'FIELD_BLUR'; fieldId: string }
  | { type: 'SUBMIT_ATTEMPT' }
  | { type: 'SUBMIT_SUCCESS'; response: FormResponse }

function initValues(schema: FormSchema): Record<string, FieldValue> {
  const values: Record<string, FieldValue> = {}
  for (const field of schema.fields) {
    const reg = getField(field.kind)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    values[field.id] = reg.createDefaultValue(field as any) as FieldValue
  }
  return values
}

function runEngines(
  schema: FormSchema,
  values: Record<string, FieldValue>
): { visibility: VisibilityState; values: Record<string, FieldValue> } {
  const visibility = runConditionalLogicEngine(schema, values)
  const computed = runCalculationEngine(schema, values, visibility)
  const newValues = { ...values }
  for (const [id, val] of Object.entries(computed)) {
    newValues[id] = { kind: 'calculation', value: val }
  }
  return { visibility, values: newValues }
}

function validateAll(
  schema: FormSchema,
  values: Record<string, FieldValue>,
  visibility: VisibilityState
): Record<string, string> {
  const errors: Record<string, string> = {}
  for (const field of schema.fields) {
    if (!visibility[field.id]) continue
    if (field.kind === 'section_header' || field.kind === 'calculation') continue
    const value = values[field.id]
    if (!value) continue
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const error = validateField(field, value as any, field.required)
    if (error) errors[field.id] = error.message
  }
  return errors
}

export function createInitialFillState(schema: FormSchema): FillState {
  const values = initValues(schema)
  const { visibility, values: engineValues } = runEngines(schema, values)
  return {
    schema,
    values: engineValues,
    touched: {},
    isSubmitted: false,
    errors: {},
    visibility,
    savedResponse: null,
  }
}

export function fillReducer(state: FillState, action: FillAction): FillState {
  switch (action.type) {
    case 'VALUE_CHANGE': {
      const newValues = { ...state.values, [action.fieldId]: action.value }
      const { visibility, values } = runEngines(state.schema, newValues)
      const errors = state.isSubmitted ? validateAll(state.schema, values, visibility) : {}
      return { ...state, values, visibility, errors }
    }

    case 'FIELD_BLUR': {
      const touched = { ...state.touched, [action.fieldId]: true }
      const field = state.schema.fields.find(f => f.id === action.fieldId)
      const newErrors = { ...state.errors }
      if (field && state.values[action.fieldId]) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const err = validateField(field, state.values[action.fieldId] as any, field.required)
        if (err) newErrors[action.fieldId] = err.message
        else delete newErrors[action.fieldId]
      }
      return { ...state, touched, errors: newErrors }
    }

    case 'SUBMIT_ATTEMPT': {
      const errors = validateAll(state.schema, state.values, state.visibility)
      return { ...state, isSubmitted: true, errors }
    }

    case 'SUBMIT_SUCCESS': {
      return { ...state, savedResponse: action.response }
    }

    default:
      return state
  }
}
