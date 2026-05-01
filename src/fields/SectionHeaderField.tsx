// src/fields/SectionHeaderField.tsx
import type { SectionHeaderConfig } from '@/types'
import type { FieldRegistration, RendererProps, EditorProps } from '@/registry'

type V = { kind: 'section_header'; value: null }

const TAG_MAP = { h1: 'h1', h2: 'h2', h3: 'h3', h4: 'h4', h5: 'h5', h6: 'h6' } as const

function Renderer({ config }: RendererProps<SectionHeaderConfig, V>) {
  const Tag = TAG_MAP[config.size]
  const fontSize = { h1: 28, h2: 22, h3: 18, h4: 16, h5: 14, h6: 13 }[config.size]
  return (
    <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>
      <Tag style={{ fontSize, fontWeight: 700, color: 'var(--text)', margin: 0 }}>{config.label}</Tag>
      {config.description && <p style={{ marginTop: 4, fontSize: 14, color: 'var(--text-muted)' }}>{config.description}</p>}
    </div>
  )
}

function Editor({ config, onChange }: EditorProps<SectionHeaderConfig>) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <label style={{ fontSize: 13, fontWeight: 500 }}>
        Size
        <select value={config.size} onChange={e => onChange({ ...config, size: e.target.value as SectionHeaderConfig['size'] })}
          style={{ display: 'block', marginTop: 4, padding: '6px 8px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', fontSize: 13 }}>
          <option value="h1">H1 — Largest</option>
          <option value="h2">H2</option>
          <option value="h3">H3</option>
          <option value="h4">H4</option>
          <option value="h5">H5</option>
          <option value="h6">H6 — Smallest</option>
        </select>
      </label>
      <label style={{ fontSize: 13, fontWeight: 500 }}>
        Description (optional)
        <textarea value={config.description ?? ''} onChange={e => onChange({ ...config, description: e.target.value || undefined })} rows={2}
          style={{ display: 'block', marginTop: 4, width: '100%', padding: '6px 8px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', fontSize: 13, resize: 'vertical' }} />
      </label>
    </div>
  )
}

export const sectionHeaderRegistration: FieldRegistration<SectionHeaderConfig, V> = {
  kind: 'section_header',
  paletteLabel: 'Section Header',
  icon: 'H',
  createDefaultConfig: (id) => ({ id, kind: 'section_header', label: 'Section Title', required: false, size: 'h2' }),
  createDefaultValue: () => ({ kind: 'section_header', value: null }),
  Renderer,
  Editor,
  validate: () => null,
}
