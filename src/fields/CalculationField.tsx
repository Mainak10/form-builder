// src/fields/CalculationField.tsx
import type { CalculationConfig, FormSchema } from '@/types'
import type { FieldRegistration, RendererProps, EditorProps } from '@/registry'

type V = { kind: 'calculation'; value: number | null }

function Renderer({ config, value }: RendererProps<CalculationConfig, V>) {
  const label = { sum: 'Sum', average: 'Average', product: 'Product' }[config.operation]

  let display: React.ReactNode
  if (config.sourceFieldIds.length === 0) {
    display = <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>No source fields configured</span>
  } else if (value.value == null) {
    display = <span style={{ color: 'var(--text-muted)' }}>—</span>
  } else {
    const dp = config.decimalPlaces ?? 2
    display = <span style={{ fontWeight: 600, fontSize: 18 }}>{value.value.toFixed(dp)}</span>
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)' }}>
        {config.label}
        <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 6, fontWeight: 400 }}>{label}</span>
      </div>
      <div style={{ padding: '10px 12px', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
        {display}
      </div>
    </div>
  )
}

interface CalcEditorProps extends EditorProps<CalculationConfig> {
  schema?: FormSchema
}

function Editor({ config, onChange, schema }: CalcEditorProps) {
  const numberFields = schema?.fields.filter(f => f.kind === 'number' && f.id !== config.id) ?? []

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <label style={{ fontSize: 13, fontWeight: 500 }}>
        Operation
        <select value={config.operation} onChange={e => onChange({ ...config, operation: e.target.value as CalculationConfig['operation'] })}
          style={{ display: 'block', marginTop: 4, padding: '6px 8px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', fontSize: 13 }}>
          <option value="sum">Sum</option>
          <option value="average">Average</option>
          <option value="product">Product</option>
        </select>
      </label>
      <label style={{ fontSize: 13, fontWeight: 500 }}>
        Decimal places
        <input type="number" min={0} max={10} value={config.decimalPlaces ?? 2} onChange={e => onChange({ ...config, decimalPlaces: Number(e.target.value) })}
          style={{ display: 'block', marginTop: 4, width: 80, padding: '6px 8px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', fontSize: 13 }} />
      </label>
      <div>
        <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 6 }}>Source number fields</div>
        {numberFields.length === 0
          ? <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>No number fields in form yet</p>
          : numberFields.map(f => (
            <label key={f.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, marginBottom: 4 }}>
              <input type="checkbox"
                checked={config.sourceFieldIds.includes(f.id)}
                onChange={e => {
                  const ids = e.target.checked
                    ? [...config.sourceFieldIds, f.id]
                    : config.sourceFieldIds.filter(id => id !== f.id)
                  onChange({ ...config, sourceFieldIds: ids })
                }}
              />
              {f.label}
            </label>
          ))
        }
      </div>
    </div>
  )
}

export const calculationRegistration: FieldRegistration<CalculationConfig, V> = {
  kind: 'calculation',
  paletteLabel: 'Calculation',
  icon: '∑',
  createDefaultConfig: (id) => ({ id, kind: 'calculation', label: 'Calculated Value', required: false, sourceFieldIds: [], operation: 'sum', decimalPlaces: 2 }),
  createDefaultValue: () => ({ kind: 'calculation', value: null }),
  Renderer,
  Editor,
  validate: () => null,
}
