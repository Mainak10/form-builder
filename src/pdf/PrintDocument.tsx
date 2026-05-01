import type { FormResponse, FieldConfig, FieldValue, FileMetadata } from '@/types'

function formatValue(value: FieldValue, field: FieldConfig): string {
  switch (value.kind) {
    case 'single_line':
    case 'multi_line':
      return value.value || '—'
    case 'number':
      return value.value == null ? '—' : String(value.value)
    case 'date':
      if (!value.value) return '—'
      return new Date(value.value + 'T00:00:00').toLocaleDateString()
    case 'single_select': {
      if (!value.value) return '—'
      if (field.kind === 'single_select') {
        const opt = field.options.find(o => o.id === value.value)
        return opt ? opt.label : value.value
      }
      return value.value
    }
    case 'multi_select': {
      if (value.value.length === 0) return '—'
      if (field.kind === 'multi_select') {
        return value.value.map(id => {
          const opt = field.options.find(o => o.id === id)
          return opt ? opt.label : id
        }).join(', ')
      }
      return value.value.join(', ')
    }
    case 'file_upload':
      if (value.value.length === 0) return '—'
      return (value.value as FileMetadata[]).map(f => `${f.name} (${(f.size / 1024).toFixed(1)} KB)`).join(', ')
    case 'calculation':
      return value.value == null ? '—' : String(value.value)
    case 'section_header':
      return ''
  }
}

interface Props {
  response: FormResponse
}

export default function PrintDocument({ response }: Props) {
  const { schemaSnapshot, values, visibleFieldIds, fieldLabelSnapshot, submittedAt } = response
  const visibleSet = new Set(visibleFieldIds)

  return (
    <div className="print-doc">
      <h1>{schemaSnapshot.title}</h1>
      <div className="meta">
        Submitted: {new Date(submittedAt).toLocaleString()}
        {' · '}Response ID: {response.id}
      </div>
      <hr className="divider" />

      {schemaSnapshot.fields
        .filter(f => visibleSet.has(f.id))
        .map(field => {
          if (field.kind === 'section_header') {
            return (
              <div key={field.id} className="section-title">{field.label}</div>
            )
          }
          const value = values[field.id]
          if (!value) return null
          const label = fieldLabelSnapshot[field.id] ?? field.label
          const formatted = formatValue(value, field)

          return (
            <div key={field.id}>
              <div className="field-label">{label}</div>
              <div className="field-value">{formatted}</div>
            </div>
          )
        })}
    </div>
  )
}
