// src/fields/NumberField.tsx
import { useState } from 'react'
import FieldWrapper from '@/components/FieldWrapper'
import type { NumberConfig } from '@/types'
import type { FieldRegistration, RendererProps, EditorProps } from '@/registry'

type V = { kind: 'number'; value: number | null }

function Renderer({ config, value, onChange, onBlur, error, isTouched, isSubmitted, isDisabled }: RendererProps<NumberConfig, V>) {
  const [raw, setRaw] = useState(() => value.value == null ? '' : String(value.value))
  const showError = isTouched || isSubmitted
  const hasAddon = config.prefix || config.suffix

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
    onBlur?.()
  }

  const inputEl = (
    <input
      id={config.id}
      type="text"
      inputMode="decimal"
      value={raw}
      onChange={e => {
        const next = e.target.value
        setRaw(next)
        const parsed = parseFloat(next)
        if (next === '' || isNaN(parsed)) {
          onChange({ kind: 'number', value: null })
        } else {
          onChange({ kind: 'number', value: parsed })
        }
      }}
      onBlur={handleBlur}
      placeholder={config.placeholder}
      disabled={isDisabled}
      style={hasAddon
        ? { flex: 1, padding: '8px 10px', border: 'none', fontSize: 14, background: 'var(--bg)', color: 'var(--text)', outline: 'none' }
        : { width: '100%', padding: '8px 10px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', fontSize: 14, background: 'var(--bg)', color: 'var(--text)' }}
    />
  )

  return (
    <FieldWrapper label={config.label} required={config.required} hint={config.hint} error={error} showError={showError} htmlFor={config.id}>
      {hasAddon ? (
        <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden', background: 'var(--bg)' }}>
          {config.prefix && (
            <span style={{ padding: '8px 10px', background: 'var(--bg-surface)', color: 'var(--text-muted)', fontSize: 14, borderRight: '1px solid var(--border)', whiteSpace: 'nowrap' }}>
              {config.prefix}
            </span>
          )}
          {inputEl}
          {config.suffix && (
            <span style={{ padding: '8px 10px', background: 'var(--bg-surface)', color: 'var(--text-muted)', fontSize: 14, borderLeft: '1px solid var(--border)', whiteSpace: 'nowrap' }}>
              {config.suffix}
            </span>
          )}
        </div>
      ) : inputEl}
    </FieldWrapper>
  )
}

function Editor({ config, onChange }: EditorProps<NumberConfig>) {
  const s = { display: 'block', marginTop: 4, width: '100%', padding: '6px 8px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', fontSize: 13 } as const
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <label style={{ fontSize: 13, fontWeight: 500 }}>
        Placeholder
        <input type="text" value={config.placeholder ?? ''} onChange={e => onChange({ ...config, placeholder: e.target.value })} style={s} />
      </label>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <label style={{ fontSize: 13, fontWeight: 500 }}>
          Min
          <input type="number" value={config.min ?? ''} onChange={e => onChange({ ...config, min: e.target.value ? Number(e.target.value) : undefined })} style={s} />
        </label>
        <label style={{ fontSize: 13, fontWeight: 500 }}>
          Max
          <input type="number" value={config.max ?? ''} onChange={e => onChange({ ...config, max: e.target.value ? Number(e.target.value) : undefined })} style={s} />
        </label>
      </div>
      <label style={{ fontSize: 13, fontWeight: 500 }}>
        Decimal places (0–4)
        <input type="number" min={0} max={4} value={config.decimalPlaces ?? ''} onChange={e => onChange({ ...config, decimalPlaces: e.target.value ? Number(e.target.value) : undefined })}
          style={{ ...s, width: 80 }} />
      </label>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <label style={{ fontSize: 13, fontWeight: 500 }}>
          Prefix
          <input type="text" value={config.prefix ?? ''} onChange={e => onChange({ ...config, prefix: e.target.value || undefined })}
            style={s} placeholder="e.g. $" />
        </label>
        <label style={{ fontSize: 13, fontWeight: 500 }}>
          Suffix
          <input type="text" value={config.suffix ?? ''} onChange={e => onChange({ ...config, suffix: e.target.value || undefined })}
            style={s} placeholder="e.g. kg" />
        </label>
      </div>
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
