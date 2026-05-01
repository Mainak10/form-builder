// src/fields/MultiSelectField.tsx
import FieldWrapper from '@/components/FieldWrapper'
import OptionsEditor from '@/components/OptionsEditor'
import type { MultiSelectConfig } from '@/types'
import type { FieldRegistration, RendererProps, EditorProps } from '@/registry'

type V = { kind: 'multi_select'; value: string[] }

function Renderer({ config, value, onChange, onBlur, error, isTouched, isSubmitted, isDisabled }: RendererProps<MultiSelectConfig, V>) {
  const showError = isTouched || isSubmitted

  function toggle(optId: string) {
    const selected = value.value
    if (selected.includes(optId)) {
      onChange({ kind: 'multi_select', value: selected.filter(id => id !== optId) })
    } else {
      if (config.maxSelections != null && selected.length >= config.maxSelections) return
      onChange({ kind: 'multi_select', value: [...selected, optId] })
    }
  }

  return (
    <FieldWrapper label={config.label} required={config.required} hint={config.hint} error={error} showError={showError}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }} onBlur={onBlur}>
        {config.options.map(o => {
          const checked = value.value.includes(o.id)
          const atMax = config.maxSelections != null && value.value.length >= config.maxSelections && !checked
          return (
            <label key={o.id} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: (isDisabled || atMax) ? 'default' : 'pointer', fontSize: 14, opacity: atMax ? 0.5 : 1 }}>
              <input
                type="checkbox"
                checked={checked}
                onChange={() => toggle(o.id)}
                disabled={isDisabled || atMax}
              />
              {o.label}
            </label>
          )
        })}
      </div>
    </FieldWrapper>
  )
}

function Editor({ config, onChange }: EditorProps<MultiSelectConfig>) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <label style={{ fontSize: 13, fontWeight: 500 }}>
          Min selections (soft)
          <input type="number" min={0} value={config.minSelections ?? ''} onChange={e => onChange({ ...config, minSelections: e.target.value ? Number(e.target.value) : undefined })}
            style={{ display: 'block', marginTop: 4, width: '100%', padding: '6px 8px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', fontSize: 13 }} />
        </label>
        <label style={{ fontSize: 13, fontWeight: 500 }}>
          Max selections (hard)
          <input type="number" min={1} value={config.maxSelections ?? ''} onChange={e => onChange({ ...config, maxSelections: e.target.value ? Number(e.target.value) : undefined })}
            style={{ display: 'block', marginTop: 4, width: '100%', padding: '6px 8px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', fontSize: 13 }} />
        </label>
      </div>
      <div>
        <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 6 }}>Options</div>
        <OptionsEditor options={config.options} onChange={options => onChange({ ...config, options })} />
      </div>
    </div>
  )
}

export const multiSelectRegistration: FieldRegistration<MultiSelectConfig, V> = {
  kind: 'multi_select',
  paletteLabel: 'Multi Select',
  icon: '☑',
  createDefaultConfig: (id) => ({
    id, kind: 'multi_select', label: 'Choose all that apply', required: false,
    options: [{ id: 'opt1', label: 'Option 1' }, { id: 'opt2', label: 'Option 2' }],
  }),
  createDefaultValue: () => ({ kind: 'multi_select', value: [] }),
  Renderer,
  Editor,
  validate: (config, value, isRequired) => {
    if (isRequired && value.value.length === 0) return 'Please select at least one option'
    if (config.minSelections != null && value.value.length < config.minSelections) {
      return `Please select at least ${config.minSelections} options`
    }
    return null
  },
}
