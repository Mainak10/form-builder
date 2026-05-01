// src/fields/DateField.tsx
import FieldWrapper from '@/components/FieldWrapper'
import type { DateConfig } from '@/types'
import type { FieldRegistration, RendererProps, EditorProps } from '@/registry'

type V = { kind: 'date'; value: string }

function todayISO(): string {
  return new Date().toISOString().slice(0, 10)
}

function Renderer({ config, value, onChange, error, isTouched, isSubmitted, isDisabled }: RendererProps<DateConfig, V>) {
  const showError = isTouched || isSubmitted
  return (
    <FieldWrapper label={config.label} required={config.required} hint={config.hint} error={error} showError={showError} htmlFor={config.id}>
      <input
        id={config.id}
        type="date"
        value={value.value}
        onChange={e => onChange({ kind: 'date', value: e.target.value })}
        disabled={isDisabled}
        style={{ width: '100%', padding: '8px 10px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', fontSize: 14, background: 'var(--bg)', color: 'var(--text)' }}
      />
    </FieldWrapper>
  )
}

function Editor({ config, onChange }: EditorProps<DateConfig>) {
  return (
    <label style={{ fontSize: 13, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 8 }}>
      <input
        type="checkbox"
        checked={config.prefillToday}
        onChange={e => onChange({ ...config, prefillToday: e.target.checked })}
      />
      Pre-fill with today's date
    </label>
  )
}

export const dateRegistration: FieldRegistration<DateConfig, V> = {
  kind: 'date',
  paletteLabel: 'Date',
  icon: '📅',
  createDefaultConfig: (id) => ({ id, kind: 'date', label: 'Date', required: false, prefillToday: false }),
  createDefaultValue: (config) => ({ kind: 'date', value: config.prefillToday ? todayISO() : '' }),
  Renderer,
  Editor,
  validate: (_config, value, isRequired) => {
    if (isRequired && value.value === '') return 'This field is required'
    return null
  },
}
