// src/fields/SectionHeaderField.tsx
import type { ElementType } from 'react'
import type { SectionHeaderConfig, SectionHeaderSize } from '@/types'
import type { FieldRegistration, RendererProps, EditorProps } from '@/registry'

type V = { kind: 'section_header'; value: null }

const SIZE_TO_TAG: Record<SectionHeaderSize, ElementType> = {
  xl: 'h1', large: 'h2', medium: 'h3', small: 'h4', xs: 'h5',
}

const SIZE_TO_PX: Record<SectionHeaderSize, number> = {
  xl: 28, large: 22, medium: 18, small: 16, xs: 14,
}

const SIZE_LABELS: { value: SectionHeaderSize; label: string }[] = [
  { value: 'xl', label: 'XL — Largest' },
  { value: 'large', label: 'Large' },
  { value: 'medium', label: 'Medium' },
  { value: 'small', label: 'Small' },
  { value: 'xs', label: 'XS — Smallest' },
]

function Renderer({ config }: RendererProps<SectionHeaderConfig, V>) {
  const Tag = SIZE_TO_TAG[config.size] ?? 'h3'
  const fontSize = SIZE_TO_PX[config.size] ?? 18
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
        <select value={config.size} onChange={e => onChange({ ...config, size: e.target.value as SectionHeaderSize })}
          style={{ display: 'block', marginTop: 4, padding: '6px 8px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', fontSize: 13 }}>
          {SIZE_LABELS.map(({ value, label }) => (
            <option key={value} value={value}>{label}</option>
          ))}
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
  createDefaultConfig: (id) => ({ id, kind: 'section_header', label: 'Section Title', required: false, size: 'medium' }),
  createDefaultValue: () => ({ kind: 'section_header', value: null }),
  Renderer,
  Editor,
  validate: () => null,
}
