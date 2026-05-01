// src/fields/FileUploadField.tsx
import { useRef } from 'react'
import FieldWrapper from '@/components/FieldWrapper'
import type { FileUploadConfig, FileMetadata } from '@/types'
import type { FieldRegistration, RendererProps, EditorProps } from '@/registry'

type V = { kind: 'file_upload'; value: FileMetadata[] }

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function Renderer({ config, value, onChange, error, isTouched, isSubmitted, isDisabled }: RendererProps<FileUploadConfig, V>) {
  const showError = isTouched || isSubmitted
  const inputRef = useRef<HTMLInputElement>(null)

  function handleFiles(files: FileList | null) {
    if (!files) return
    const maxBytes = config.maxFileSizeMB != null ? config.maxFileSizeMB * 1024 * 1024 : Infinity
    const newMeta: FileMetadata[] = Array.from(files)
      .filter(f => f.size <= maxBytes)
      .map(f => ({ name: f.name, size: f.size, type: f.type, lastModified: f.lastModified }))
    onChange({ kind: 'file_upload', value: [...value.value, ...newMeta] })
  }

  function remove(index: number) {
    onChange({ kind: 'file_upload', value: value.value.filter((_, i) => i !== index) })
  }

  return (
    <FieldWrapper label={config.label} required={config.required} hint={config.hint} error={error} showError={showError}>
      <div
        onDrop={e => { e.preventDefault(); handleFiles(e.dataTransfer.files) }}
        onDragOver={e => e.preventDefault()}
        onClick={() => !isDisabled && inputRef.current?.click()}
        style={{
          border: '2px dashed var(--border)',
          borderRadius: 'var(--radius)',
          padding: 24,
          textAlign: 'center',
          cursor: isDisabled ? 'default' : 'pointer',
          fontSize: 14,
          color: 'var(--text-muted)',
        }}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={config.acceptedTypes?.join(',')}
          style={{ display: 'none' }}
          onChange={e => handleFiles(e.target.files)}
          disabled={isDisabled}
        />
        Drop files here or click to upload
        {config.maxFileSizeMB != null && <div style={{ fontSize: 12, marginTop: 4 }}>Max size: {config.maxFileSizeMB} MB</div>}
      </div>
      {value.value.length > 0 && (
        <ul style={{ margin: '8px 0 0', padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 4 }}>
          {value.value.map((f, i) => (
            <li key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, background: 'var(--bg-surface)', padding: '6px 8px', borderRadius: 'var(--radius)' }}>
              <span style={{ flex: 1 }}>{f.name}</span>
              <span style={{ color: 'var(--text-muted)' }}>{formatBytes(f.size)}</span>
              {!isDisabled && <button type="button" onClick={() => remove(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 16 }}>✕</button>}
            </li>
          ))}
        </ul>
      )}
    </FieldWrapper>
  )
}

function Editor({ config, onChange }: EditorProps<FileUploadConfig>) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <label style={{ fontSize: 13, fontWeight: 500 }}>
        Max file size (MB)
        <input type="number" min={1} value={config.maxFileSizeMB ?? ''} onChange={e => onChange({ ...config, maxFileSizeMB: e.target.value ? Number(e.target.value) : undefined })}
          style={{ display: 'block', marginTop: 4, width: 100, padding: '6px 8px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', fontSize: 13 }} />
      </label>
      <label style={{ fontSize: 13, fontWeight: 500 }}>
        Accepted types (comma-separated, e.g. image/*,.pdf)
        <input type="text" value={config.acceptedTypes?.join(',') ?? ''} onChange={e => onChange({ ...config, acceptedTypes: e.target.value ? e.target.value.split(',').map(s => s.trim()) : undefined })}
          style={{ display: 'block', marginTop: 4, width: '100%', padding: '6px 8px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', fontSize: 13 }} />
      </label>
    </div>
  )
}

export const fileUploadRegistration: FieldRegistration<FileUploadConfig, V> = {
  kind: 'file_upload',
  paletteLabel: 'File Upload',
  icon: '📎',
  createDefaultConfig: (id) => ({ id, kind: 'file_upload', label: 'Upload Files', required: false }),
  createDefaultValue: () => ({ kind: 'file_upload', value: [] }),
  Renderer,
  Editor,
  validate: (_config, value, isRequired) => {
    if (isRequired && value.value.length === 0) return 'Please upload at least one file'
    return null
  },
}
