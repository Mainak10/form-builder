import type { FormSchema, FieldValue, VisibilityState, CalculationConfig } from '@/types'

export function runCalculationEngine(
  schema: FormSchema,
  values: Record<string, FieldValue>,
  visibility: VisibilityState
): Record<string, number | null> {
  const computed: Record<string, number | null> = {}

  for (const field of schema.fields) {
    if (field.kind !== 'calculation') continue

    const calcConfig = field as CalculationConfig
    const sources = calcConfig.sourceFieldIds
      .filter(id => {
        const sourceField = schema.fields.find(f => f.id === id)
        if (!sourceField) return false
        if (sourceField.kind === 'calculation') return false
        if (!visibility[id]) return false
        return true
      })
      .map(id => {
        const v = values[id]
        if (!v || v.kind !== 'number') return null
        return v.value
      })
      .filter((v): v is number => v !== null)

    if (sources.length === 0) {
      computed[field.id] = null
      continue
    }

    let result: number
    if (calcConfig.operation === 'sum') {
      result = sources.reduce((a, b) => a + b, 0)
    } else if (calcConfig.operation === 'average') {
      result = sources.reduce((a, b) => a + b, 0) / sources.length
    } else if (calcConfig.operation === 'minimum') {
      result = Math.min(...sources)
    } else {
      result = Math.max(...sources)
    }

    const dp = calcConfig.decimalPlaces ?? 2
    computed[field.id] = parseFloat(result.toFixed(dp))
  }

  return computed
}
