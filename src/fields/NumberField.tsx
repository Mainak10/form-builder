// src/fields/NumberField.tsx
import { useState } from 'react'
import FieldWrapper from '@/components/FieldWrapper'
import type { NumberConfig } from '@/types'
import type { FieldRegistration, RendererProps, EditorProps } from '@/registry'

type V = { kind: 'number'; value: number | null }

function Renderer({ config, value, onChange, error, isTouched, isSubmitted, isDisabled }: RendererProps<NumberConfig, V>) {
  const [raw, setRaw] = useState(() => value.value == null ? '' : String(value.value))
  const showError = isTouched || isSubmitted

  function handleBlur() {
    const parsed = parseFloat(raw)
    if (raw === '' || isNaN(parsed)) {
      onChange({ kind: 'number', value: null })
    } else {
      const dp = config.decimalPlaces
      const rounded = dp != null ? parseFloat(parsed.toFixed(dp)) : parsed
      setRaw(String(rounded))
      onChange({ kind: 'number', value: rounded })
    }
  }

  return (
    <FieldWrapper label={config.label} required={config.required} hint={config.hint} error={error} showError={showError} htmlFor={config.id}>
      <input
        id={config.id}
        type="text"
        inputMode="decimal"
        value={raw}
        onChange={e => setRaw(e.target.value)}
        onBlur={handleBlur}
        placeholder={config.placeholder}
        disabled={isDisabled}
        style={{ width: '100%', padding: '8px 10px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', fontSize: 14, background: 'var(--bg)', color: 'var(--text)' }}
      />
    </FieldWrapper>
  )
}

function Editor({ config, onChange }: EditorProps<NumberConfig>) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <label style={{ fontSize: 13, fontWeight: 500 }}>
        Placeholder
        <input type="text" value={config.placeholder ?? ''} onChange={e => onChange({ ...config, placeholder: e.target.value })}
          style={{ display: 'block', marginTop: 4, width: '100%', padding: '6px 8px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', fontSize: 13 }} />
      </label>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <label style={{ fontSize: 13, fontWeight: 500 }}>
          Min
          <input type="number" value={config.min ?? ''} onChange={e => onChange({ ...config, min: e.target.value ? Number(e.target.value) : undefined })}
            style={{ display: 'block', marginTop: 4, width: '100%', padding: '6px 8px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', fontSize: 13 }} />
        </label>
        <label style={{ fontSize: 13, fontWeight: 500 }}>
          Max
          <input type="number" value={config.max ?? ''} onChange={e => onChange({ ...config, max: e.target.value ? Number(e.target.value) : undefined })}
            style={{ display: 'block', marginTop: 4, width: '100%', padding: '6px 8px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', fontSize: 13 }} />
        </label>
      </div>
      <label style={{ fontSize: 13, fontWeight: 500 }}>
        Decimal places
        <input type="number" min={0} max={10} value={config.decimalPlaces ?? ''} onChange={e => onChange({ ...config, decimalPlaces: e.target.value ? Number(e.target.value) : undefined })}
          style={{ display: 'block', marginTop: 4, width: 80, padding: '6px 8px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', fontSize: 13 }} />
      </label>
    </div>
  )
}

export const numberRegistration: FieldRegistration<NumberConfig, V> = {
  kind: 'number',
  paletteLabel: 'Number',
  icon: '#',
  createDefaultConfig: (id) => ({ id, kind: 'number', label: 'Number Field', required: false }),
  createDefaultValue: () => ({ kind: 'number', value: null }),
  Renderer,
  Editor,
  validate: (config, value, isRequired) => {
    if (isRequired && value.value == null) return 'This field is required'
    if (value.value != null && config.min != null && value.value < config.min) return `Must be at least ${config.min}`
    if (value.value != null && config.max != null && value.value > config.max) return `Must be at most ${config.max}`
    return null
  },
}
