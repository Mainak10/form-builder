// src/fields/SingleLineField.tsx
import FieldWrapper from '@/components/FieldWrapper'
import type { SingleLineConfig } from '@/types'
import type { FieldRegistration, RendererProps, EditorProps } from '@/registry'

type V = { kind: 'single_line'; value: string }

function Renderer({ config, value, onChange, onBlur, error, isTouched, isSubmitted, isDisabled }: RendererProps<SingleLineConfig, V>) {
  const showError = isTouched || isSubmitted
  return (
    <FieldWrapper label={config.label} required={config.required} hint={config.hint} error={error} showError={showError} htmlFor={config.id}>
      <input
        id={config.id}
        type="text"
        value={value.value}
        onChange={e => onChange({ kind: 'single_line', value: e.target.value })}
        onBlur={onBlur}
        placeholder={config.placeholder}
        maxLength={config.maxLength}
        disabled={isDisabled}
        style={{ width: '100%', padding: '8px 10px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', fontSize: 14, background: 'var(--bg)', color: 'var(--text)' }}
      />
    </FieldWrapper>
  )
}

function Editor({ config, onChange }: EditorProps<SingleLineConfig>) {
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
        Max length (optional)
        <input
          type="number"
          value={config.maxLength ?? ''}
          onChange={e => onChange({ ...config, maxLength: e.target.value ? Number(e.target.value) : undefined })}
          style={{ display: 'block', marginTop: 4, width: '100%', padding: '6px 8px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', fontSize: 13 }}
        />
      </label>
    </div>
  )
}

export const singleLineRegistration: FieldRegistration<SingleLineConfig, V> = {
  kind: 'single_line',
  paletteLabel: 'Single Line Text',
  icon: '—',
  createDefaultConfig: (id) => ({ id, kind: 'single_line', label: 'Text Field', required: false }),
  createDefaultValue: () => ({ kind: 'single_line', value: '' }),
  Renderer,
  Editor,
  validate: (_config, value, isRequired) => {
    if (isRequired && value.value.trim() === '') return 'This field is required'
    return null
  },
}
