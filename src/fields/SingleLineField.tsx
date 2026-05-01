// src/fields/SingleLineField.tsx
import FieldWrapper from '@/components/FieldWrapper'
import type { SingleLineConfig } from '@/types'
import type { FieldRegistration, RendererProps, EditorProps } from '@/registry'

type V = { kind: 'single_line'; value: string }

const inputStyle = { width: '100%', padding: '8px 10px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', fontSize: 14, background: 'var(--bg)', color: 'var(--text)' } as const

function Renderer({ config, value, onChange, onBlur, error, isTouched, isSubmitted, isDisabled }: RendererProps<SingleLineConfig, V>) {
  const showError = isTouched || isSubmitted
  const hasAddon = config.prefix || config.suffix
  return (
    <FieldWrapper label={config.label} required={config.required} hint={config.hint} error={error} showError={showError} htmlFor={config.id}>
      {hasAddon ? (
        <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden', background: 'var(--bg)' }}>
          {config.prefix && (
            <span style={{ padding: '8px 10px', background: 'var(--bg-surface)', color: 'var(--text-muted)', fontSize: 14, borderRight: '1px solid var(--border)', whiteSpace: 'nowrap' }}>
              {config.prefix}
            </span>
          )}
          <input
            id={config.id}
            type="text"
            value={value.value}
            onChange={e => onChange({ kind: 'single_line', value: e.target.value })}
            onBlur={onBlur}
            placeholder={config.placeholder}
            maxLength={config.maxLength}
            disabled={isDisabled}
            style={{ flex: 1, padding: '8px 10px', border: 'none', fontSize: 14, background: 'var(--bg)', color: 'var(--text)', outline: 'none' }}
          />
          {config.suffix && (
            <span style={{ padding: '8px 10px', background: 'var(--bg-surface)', color: 'var(--text-muted)', fontSize: 14, borderLeft: '1px solid var(--border)', whiteSpace: 'nowrap' }}>
              {config.suffix}
            </span>
          )}
        </div>
      ) : (
        <input
          id={config.id}
          type="text"
          value={value.value}
          onChange={e => onChange({ kind: 'single_line', value: e.target.value })}
          onBlur={onBlur}
          placeholder={config.placeholder}
          maxLength={config.maxLength}
          disabled={isDisabled}
          style={inputStyle}
        />
      )}
    </FieldWrapper>
  )
}

function Editor({ config, onChange }: EditorProps<SingleLineConfig>) {
  const fieldStyle = { display: 'block', marginTop: 4, width: '100%', padding: '6px 8px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', fontSize: 13 } as const
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <label style={{ fontSize: 13, fontWeight: 500 }}>
        Placeholder
        <input type="text" value={config.placeholder ?? ''} onChange={e => onChange({ ...config, placeholder: e.target.value })} style={fieldStyle} />
      </label>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <label style={{ fontSize: 13, fontWeight: 500 }}>
          Min length
          <input type="number" min={0} value={config.minLength ?? ''} onChange={e => onChange({ ...config, minLength: e.target.value ? Number(e.target.value) : undefined })}
            style={{ display: 'block', marginTop: 4, width: '100%', padding: '6px 8px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', fontSize: 13 }} />
        </label>
        <label style={{ fontSize: 13, fontWeight: 500 }}>
          Max length
          <input type="number" min={0} value={config.maxLength ?? ''} onChange={e => onChange({ ...config, maxLength: e.target.value ? Number(e.target.value) : undefined })}
            style={{ display: 'block', marginTop: 4, width: '100%', padding: '6px 8px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', fontSize: 13 }} />
        </label>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <label style={{ fontSize: 13, fontWeight: 500 }}>
          Prefix text
          <input type="text" value={config.prefix ?? ''} onChange={e => onChange({ ...config, prefix: e.target.value || undefined })}
            style={{ display: 'block', marginTop: 4, width: '100%', padding: '6px 8px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', fontSize: 13 }}
            placeholder="e.g. https://" />
        </label>
        <label style={{ fontSize: 13, fontWeight: 500 }}>
          Suffix text
          <input type="text" value={config.suffix ?? ''} onChange={e => onChange({ ...config, suffix: e.target.value || undefined })}
            style={{ display: 'block', marginTop: 4, width: '100%', padding: '6px 8px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', fontSize: 13 }}
            placeholder="e.g. .com" />
        </label>
      </div>
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
  validate: (config, value, isRequired) => {
    if (isRequired && value.value.trim() === '') return 'This field is required'
    if (config.minLength && value.value.length > 0 && value.value.length < config.minLength) return `Must be at least ${config.minLength} characters`
    return null
  },
}
