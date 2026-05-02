import { useReducer, useEffect, useState, useCallback } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { builderReducer, createInitialBuilderState } from '@/builder/BuilderReducer'
import FieldPalette from '@/builder/FieldPalette'
import BuilderCanvas from '@/builder/BuilderCanvas'
import ConfigPanel from '@/builder/ConfigPanel'
import { getField } from '@/registry'
import { getTemplate, saveTemplate } from '@/storage'
import type { FieldKind } from '@/types'
import styles from './BuilderPage.module.css'

export default function BuilderPage() {
  const { templateId } = useParams()
  const navigate = useNavigate()
  const [state, dispatch] = useReducer(builderReducer, undefined, () => {
    if (templateId) {
      const stored = getTemplate(templateId)
      if (stored) return createInitialBuilderState(stored.schema)
    }
    return createInitialBuilderState()
  })
  const [showPreview, setShowPreview] = useState(false)
  const [saveMsg, setSaveMsg] = useState<string | null>(null)
  const [saveAttempted, setSaveAttempted] = useState(false)

  useEffect(() => {
    function handler(e: BeforeUnloadEvent) {
      if (state.isDirty) e.preventDefault()
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [state.isDirty])

  const save = useCallback(() => {
    const errors = state.schemaErrors
    if (errors.length > 0) {
      setSaveAttempted(true)
      return
    }
    const ok = saveTemplate(state.schema)
    if (ok) {
      dispatch({ type: 'SAVE_SUCCESS' })
      setSaveAttempted(false)
      setSaveMsg('Saved!')
      setTimeout(() => setSaveMsg(null), 2000)
      if (!templateId) {
        navigate(`/builder/${state.schema.id}`, { replace: true })
      }
    } else {
      setSaveMsg('Save failed — storage full')
      setTimeout(() => setSaveMsg(null), 3000)
    }
  }, [state.schema, state.schemaErrors, templateId, navigate])

  const selectedField = state.selectedFieldId
    ? state.schema.fields.find(f => f.id === state.selectedFieldId) ?? null
    : null

  const fieldErrors: Record<string, string> = {}
  const formErrors: string[] = []
  if (saveAttempted) {
    for (const e of state.schemaErrors) {
      if (e.fieldId) fieldErrors[e.fieldId] = e.message
      else formErrors.push(e.message)
    }
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link to="/" className={styles.backLink}>← Templates</Link>
        <input
          className={styles.titleInput}
          value={state.schema.title}
          onChange={e => dispatch({ type: 'FORM_UPDATE', title: e.target.value, description: state.schema.description })}
          placeholder="Untitled Form"
        />
        <div className={styles.headerRight}>
          {saveMsg && <span>{saveMsg}</span>}
          {state.schema.fields.length > 0 && (
            <button className={styles.btn} onClick={() => setShowPreview(true)}>Preview</button>
          )}
          <button
            className={`${styles.btn} ${styles.btnPrimary}`}
            onClick={save}
            disabled={!state.isDirty && !!templateId}
          >
            {state.isDirty ? 'Save' : 'Saved'}
          </button>
        </div>
      </header>

      {saveAttempted && state.schemaErrors.length > 0 && (
        <div className={styles.errorBar}>
          {formErrors.map((msg, i) => <span key={i} className={styles.errorItem}>⚠ {msg}</span>)}
          {Object.values(fieldErrors).map((msg, i) => <span key={`f${i}`} className={styles.errorItem}>⚠ {msg}</span>)}
        </div>
      )}

      <div className={styles.body}>
        <div className={styles.palette}>
          <FieldPalette onAddField={(kind: FieldKind) => dispatch({ type: 'FIELD_ADD', kind })} />
        </div>
        <BuilderCanvas
          schema={state.schema}
          selectedFieldId={state.selectedFieldId}
          fieldErrors={fieldErrors}
          onSelectField={id => dispatch({ type: 'FIELD_SELECT', fieldId: id })}
          onDeleteField={id => dispatch({ type: 'FIELD_DELETE', fieldId: id })}
          onReorder={(from, to) => dispatch({ type: 'FIELD_REORDER', fromIndex: from, toIndex: to })}
        />
        <div className={styles.configPanel}>
          <ConfigPanel selectedField={selectedField} schema={state.schema} dispatch={dispatch} />
        </div>
      </div>

      {showPreview && (
        <div className={styles.modal} onClick={() => setShowPreview(false)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 style={{ fontSize: 16 }}>Preview</h2>
              <button onClick={() => setShowPreview(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: 'var(--text-muted)' }}>✕</button>
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Preview mode — conditional logic is inactive in preview.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {state.schema.fields.map(config => {
                const reg = getField(config.kind)
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const defaultVal = reg.createDefaultValue(config as any)
                return (
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  <reg.Renderer key={config.id} config={config as any} value={defaultVal as any} onChange={() => {}} error={undefined} isTouched={false} isSubmitted={false} isDisabled />
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
