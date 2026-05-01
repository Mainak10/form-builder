// src/pages/InstancesListPage.tsx
import { useState, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getTemplate, getResponses } from '@/storage'
import PrintDocument from '@/pdf/PrintDocument'
import type { FormResponse } from '@/types'
import styles from './InstancesListPage.module.css'

export default function InstancesListPage() {
  const { templateId } = useParams()
  const stored = templateId ? getTemplate(templateId) : null
  const responses = templateId ? getResponses(templateId) : []
  const [printResponse, setPrintResponse] = useState<FormResponse | null>(null)
  const printRef = useRef<HTMLDivElement>(null)

  function downloadPDF(response: FormResponse) {
    setPrintResponse(response)
    setTimeout(() => {
      window.print()
    }, 50)
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link to="/" className={styles.backLink}>← Templates</Link>
      </header>

      <main className={styles.main}>
        {!stored && (
          <div className={styles.deletedBanner}>
            This template has been deleted. Response data is shown below for reference.
          </div>
        )}

        <h1 className={styles.pageTitle}>
          {stored ? stored.schema.title : 'Deleted Template'} — Responses
        </h1>
        <p className={styles.subtitle}>{responses.length} response{responses.length !== 1 ? 's' : ''}</p>

        {responses.length === 0 ? (
          <div className={styles.empty}>No responses yet.</div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Submitted</th>
                <th>Response ID</th>
                <th>Fields filled</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {responses.map(resp => (
                <tr key={resp.id}>
                  <td>{new Date(resp.submittedAt).toLocaleString()}</td>
                  <td style={{ fontFamily: 'var(--mono)', fontSize: 12 }}>{resp.id.slice(0, 16)}…</td>
                  <td>{resp.visibleFieldIds.length}</td>
                  <td>
                    <button className={styles.pdfBtn} onClick={() => downloadPDF(resp)}>
                      Download PDF
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </main>

      {/* Hidden print target */}
      <div ref={printRef} className="print-only">
        {printResponse && <PrintDocument response={printResponse} />}
      </div>
    </div>
  )
}
