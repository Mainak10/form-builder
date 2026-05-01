// src/fields/SingleSelectField.tsx
import FieldWrapper from '@/components/FieldWrapper'
import OptionsEditor from '@/components/OptionsEditor'
import type { SingleSelectConfig, SingleSelectDisplayType } from '@/types'
import type { FieldRegistration, RendererProps, EditorProps } from '@/registry'

type V = { kind: 'single_select'; value: string }

function Renderer({ config, value, onChange, error, isTouched, isSubmitted, isDisabled }: RendererProps<SingleSelectConfig, V>) {
  const showError = isTouched || isSubmitted

  function select(optId: string) {
    onChange({ kind: 'single_select', value: optId })
  }

  let input: React.ReactNode
  if (config.displayType === 'dropdown') {
    input = (
      <select
        id={config.id}
        value={value.value}
        onChange={e => select(e.target.value)}
        disabled={isDisabled}
        style={{ width: '100%', padding: '8px 10px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', fontSize: 14, background: 'var(--bg)', color: 'var(--text)' }}
      >
        <option value="">— Select —</option>
        {config.options.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
      </select>
    )
  } else if (config.displayType === 'tiles') {
    input = (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {config.options.map(o => (
          <button
            key={o.id}
            type="button"
            onClick={() => select(o.id)}
            disabled={isDisabled}
            style={{
              padding: '8px 16px',
              borderRadius: 'var(--radius)',
              border: `2px solid ${value.value === o.id ? 'var(--accent)' : 'var(--border)'}`,
              background: value.value === o.id ? 'var(--accent-bg)' : 'var(--bg)',
              color: value.value === o.id ? 'var(--accent)' : 'var(--text)',
              fontWeight: value.value === o.id ? 600 : 400,
              cursor: isDisabled ? 'default' : 'pointer',
              fontSize: 14,
            }}
          >
            {o.label}
          </button>
        ))}
      </div>
    )
  } else {
    // radio (default)
    input = (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {config.options.map(o => (
          <label key={o.id} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: isDisabled ? 'default' : 'pointer', fontSize: 14 }}>
            <input
              type="radio"
              name={config.id}
              value={o.id}
              checked={value.value === o.id}
              onChange={() => select(o.id)}
              disabled={isDisabled}
            />
            {o.label}
          </label>
        ))}
      </div>
    )
  }

  return (
    <FieldWrapper label={config.label} required={config.required} hint={config.hint} error={error} showError={showError} htmlFor={config.displayType === 'dropdown' ? config.id : undefined}>
      {input}
    </FieldWrapper>
  )
}

function Editor({ config, onChange }: EditorProps<SingleSelectConfig>) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <label style={{ fontSize: 13, fontWeight: 500 }}>
        Display type
        <select
          value={config.displayType}
          onChange={e => onChange({ ...config, displayType: e.target.value as SingleSelectDisplayType })}
          style={{ display: 'block', marginTop: 4, padding: '6px 8px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', fontSize: 13 }}
        >
          <option value="radio">Radio buttons</option>
          <option value="dropdown">Dropdown</option>
          <option value="tiles">Tiles</option>
        </select>
      </label>
      <div>
        <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 6 }}>Options</div>
        <OptionsEditor options={config.options} onChange={options => onChange({ ...config, options })} />
      </div>
    </div>
  )
}

export const singleSelectRegistration: FieldRegistration<SingleSelectConfig, V> = {
  kind: 'single_select',
  paletteLabel: 'Single Select',
  icon: '◉',
  createDefaultConfig: (id) => ({
    id, kind: 'single_select', label: 'Choose one', required: false,
    options: [{ id: 'opt1', label: 'Option 1' }, { id: 'opt2', label: 'Option 2' }],
    displayType: 'radio',
  }),
  createDefaultValue: () => ({ kind: 'single_select', value: '' }),
  Renderer,
  Editor,
  validate: (_config, value, isRequired) => {
    if (isRequired && value.value === '') return 'Please select an option'
    return null
  },
}
