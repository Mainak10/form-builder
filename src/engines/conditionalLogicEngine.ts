import type { FormSchema, FieldValue, VisibilityState, Condition } from '@/types'

function evaluateCondition(condition: Condition, values: Record<string, FieldValue>): boolean {
  const { targetFieldId, operator, value } = condition
  const fieldValue = values[targetFieldId]

  if (operator === 'is_filled') {
    if (!fieldValue) return false
    if (fieldValue.kind === 'single_line' || fieldValue.kind === 'multi_line') return fieldValue.value.trim().length > 0
    if (fieldValue.kind === 'number') return fieldValue.value !== null
    if (fieldValue.kind === 'date') return fieldValue.value.length > 0
    if (fieldValue.kind === 'single_select') return fieldValue.value.length > 0
    if (fieldValue.kind === 'multi_select') return fieldValue.value.length > 0
    if (fieldValue.kind === 'file_upload') return fieldValue.value.length > 0
    return false
  }

  if (operator === 'is_empty') {
    if (!fieldValue) return true
    if (fieldValue.kind === 'single_line' || fieldValue.kind === 'multi_line') return fieldValue.value.trim().length === 0
    if (fieldValue.kind === 'number') return fieldValue.value === null
    if (fieldValue.kind === 'date') return fieldValue.value.length === 0
    if (fieldValue.kind === 'single_select') return fieldValue.value.length === 0
    if (fieldValue.kind === 'multi_select') return fieldValue.value.length === 0
    if (fieldValue.kind === 'file_upload') return fieldValue.value.length === 0
    return true
  }

  if (!fieldValue) return false

  if (fieldValue.kind === 'single_line' || fieldValue.kind === 'multi_line') {
    const str = fieldValue.value
    const target = String(value ?? '')
    if (operator === 'equals') return str === target
    if (operator === 'not_equals') return str !== target
    if (operator === 'contains') return str.includes(target)
    if (operator === 'not_contains') return !str.includes(target)
  }

  if (fieldValue.kind === 'number') {
    const num = fieldValue.value
    if (num === null) return false
    const target = Number(value)
    if (operator === 'equals') return num === target
    if (operator === 'not_equals') return num !== target
    if (operator === 'greater_than') return num > target
    if (operator === 'less_than') return num < target
  }

  if (fieldValue.kind === 'date') {
    const date = fieldValue.value
    const target = String(value ?? '')
    if (operator === 'equals') return date === target
    if (operator === 'not_equals') return date !== target
    if (operator === 'before') return date < target
    if (operator === 'after') return date > target
  }

  if (fieldValue.kind === 'single_select') {
    const selected = fieldValue.value
    const target = String(value ?? '')
    if (operator === 'equals') return selected === target
    if (operator === 'not_equals') return selected !== target
    if (operator === 'includes_option') return selected === target
    if (operator === 'excludes_option') return selected !== target
  }

  if (fieldValue.kind === 'multi_select') {
    const selected = fieldValue.value
    const target = String(value ?? '')
    if (operator === 'includes_option') return selected.includes(target)
    if (operator === 'excludes_option') return !selected.includes(target)
  }

  return false
}

export function runConditionalLogicEngine(
  schema: FormSchema,
  values: Record<string, FieldValue>
): VisibilityState {
  const visibility: VisibilityState = {}

  for (const field of schema.fields) {
    const rule = schema.conditionalRules[field.id]
    if (!rule || rule.conditions.length === 0) {
      visibility[field.id] = true
      continue
    }
    const results = rule.conditions.map(c => evaluateCondition(c, values))
    visibility[field.id] = rule.logic === 'AND' ? results.every(Boolean) : results.some(Boolean)
  }

  return visibility
}
