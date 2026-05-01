import type { FormSchema, FieldValue, VisibilityState, Condition, EngineResult } from '@/types'

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
    if (operator === 'is_within_range') {
      const parts = String(value ?? '').split(',').map(Number)
      if (parts.length !== 2 || parts.some(isNaN)) return false
      return num >= parts[0] && num <= parts[1]
    }
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
    if (operator === 'contains_all_of') {
      const targets = target.split(',').filter(Boolean)
      return targets.length > 0 && targets.every(t => selected.includes(t))
    }
  }

  return false
}

export function runConditionalLogicEngine(
  schema: FormSchema,
  values: Record<string, FieldValue>
): EngineResult {
  const visibility: VisibilityState = {}
  const requiredOverrides: Record<string, boolean | null> = {}

  for (const field of schema.fields) {
    const rule = schema.conditionalRules[field.id]
    requiredOverrides[field.id] = null

    if (!rule || rule.conditions.length === 0) {
      visibility[field.id] = true
      continue
    }

    const conditionsMet = rule.logic === 'AND'
      ? rule.conditions.every(c => evaluateCondition(c, values))
      : rule.conditions.some(c => evaluateCondition(c, values))

    const effect = rule.effect ?? 'show'
    const defaultVisible = rule.defaultVisible ?? (effect === 'hide')

    switch (effect) {
      case 'show':
        visibility[field.id] = conditionsMet ? true : defaultVisible
        break
      case 'hide':
        visibility[field.id] = conditionsMet ? false : defaultVisible
        break
      case 'mark_required':
        visibility[field.id] = true
        requiredOverrides[field.id] = conditionsMet ? true : null
        break
      case 'mark_not_required':
        visibility[field.id] = true
        requiredOverrides[field.id] = conditionsMet ? false : null
        break
    }
  }

  return { visibility, requiredOverrides }
}
