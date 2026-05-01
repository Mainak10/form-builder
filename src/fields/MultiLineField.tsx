// src/fields/MultiLineField.tsx
import FieldWrapper from '@/components/FieldWrapper'
import type { MultiLineConfig } from '@/types'
import type { FieldRegistration, RendererProps, EditorProps } from '@/registry'

type V = { kind: 'multi_line'; value: string }

function Renderer({ config, value, onChange, error, isTouched, isSubmitted, isDisabled }: RendererProps<MultiLineConfig, V>) {
  const showError = isTouched || isSubmitted
  return (
    <FieldWrapper label={config.label} required={config.required} hint={config.hint} error={error} showError={showError} htmlFor={config.id}>
      <textarea
        id={config.id}
        value={value.value}
        onChange={e => onChange({ kind: 'multi_line', value: e.target.value })}
        placeholder={config.placeholder}
        rows={config.rows ?? 4}
        disabled={isDisabled}
        style={{ width: '100%', padding: '8px 10px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', fontSize: 14, resize: 'vertical', background: 'var(--bg)', color: 'var(--text)' }}
      />
    </FieldWrapper>
  )
}

function Editor({ config, onChange }: EditorProps<MultiLineConfig>) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <label style={{ fontSize: 13, fontWeight: 500 }}>
        Placeholder
        <input
          type="text"
          value={config.placeholder ?? ''}
          onChange={e => onChange({ ...config, placeholder: e.target.value })}
          style={{ display: 'block', marginTop: 4, width: '100%', padding: '6px 8px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', fontSize: 13 }}
        />
      </label>
      <label style={{ fontSize: 13, fontWeight: 500 }}>
        Rows
        <input
          type="number"
          min={2}
          max={20}
          value={config.rows ?? 4}
          onChange={e => onChange({ ...config, rows: Number(e.target.value) })}
          style={{ display: 'block', marginTop: 4, width: 80, padding: '6px 8px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', fontSize: 13 }}
        />
      </label>
    </div>
  )
}

export const multiLineRegistration: FieldRegistration<MultiLineConfig, V> = {
  kind: 'multi_line',
  paletteLabel: 'Multi Line Text',
  icon: '≡',
  createDefaultConfig: (id) => ({ id, kind: 'multi_line', label: 'Text Area', required: false }),
  createDefaultValue: () => ({ kind: 'multi_line', value: '' }),
  Renderer,
  Editor,
  validate: (_config, value, isRequired) => {
    if (isRequired && value.value.trim() === '') return 'This field is required'
    return null
  },
}
