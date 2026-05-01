// src/pages/FillPage.tsx
import { useReducer, useCallback, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useParams, Link } from 'react-router-dom'
import { getTemplate, saveResponse } from '@/storage'
import { fillReducer, createInitialFillState } from '@/fill/FillReducer'
import FillForm from '@/fill/FillForm'
import PrintDocument from '@/pdf/PrintDocument'
import type { FormResponse } from '@/types'
import styles from './FillPage.module.css'

function generateId(): string {
  return `resp_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
}

export default function FillPage() {
  const { templateId } = useParams()
  const stored = templateId ? getTemplate(templateId) : null
  const [state, dispatch] = useReducer(fillReducer, stored?.schema, schema => {
    if (!schema) return createInitialFillState({ id: '', title: 'Not found', description: '', fields: [], conditionalRules: {}, createdAt: '', updatedAt: '' })
    return createInitialFillState(schema)
  })
  const printRef = useRef<HTMLDivElement>(null)
  const hasSavedRef = useRef(false)

  const handleSubmit = useCallback(() => {
    dispatch({ type: 'SUBMIT_ATTEMPT' })
  }, [])

  useEffect(() => {
    const hasErrors = Object.keys(state.errors).length > 0
    if (state.isSubmitted && !hasErrors && !state.savedResponse && !hasSavedRef.current) {
      hasSavedRef.current = true
      const visibleFieldIds = state.schema.fields
        .filter(f => state.visibility[f.id] !== false)
        .map(f => f.id)

      const fieldLabelSnapshot: Record<string, string> = {}
      for (const f of state.schema.fields) {
        fieldLabelSnapshot[f.id] = f.label
      }

      const response: FormResponse = {
        id: generateId(),
        templateId: state.schema.id,
        schemaSnapshot: state.schema,
        values: state.values,
        visibleFieldIds,
        fieldLabelSnapshot,
        submittedAt: new Date().toISOString(),
      }
      saveResponse(response)
      dispatch({ type: 'SUBMIT_SUCCESS', response })
    }
  }, [state.isSubmitted, state.errors, state.savedResponse, state.schema, state.values, state.visibility])

  if (!stored) {
    return (
      <div className={styles.page}>
        <div className={styles.main}>
          <h1>Form not found</h1>
          <Link to="/">← Back to templates</Link>
        </div>
      </div>
    )
  }

  function downloadPDF() {
    window.print()
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link to="/" className={styles.backLink}>← Templates</Link>
      </header>

      <main className={styles.main}>
        {state.savedResponse ? (
          <div className={styles.success}>
            <span className={styles.successIcon}>✓</span>
            <h2>Submitted!</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Your response has been recorded.</p>
            <button className={styles.pdfBtn} onClick={downloadPDF}>Download PDF</button>
            <Link to="/" style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 8 }}>Back to templates</Link>
          </div>
        ) : (
          <>
            <div className={styles.formHeader}>
              <h1 className={styles.formTitle}>{state.schema.title}</h1>
              {state.schema.description && <p className={styles.formDesc}>{state.schema.description}</p>}
            </div>
            <FillForm state={state} dispatch={dispatch} onSubmit={handleSubmit} />
          </>
        )}
      </main>

      {state.savedResponse && createPortal(
        <div ref={printRef} className="print-only">
          <PrintDocument response={state.savedResponse} />
        </div>,
        document.body
      )}
    </div>
  )
}
