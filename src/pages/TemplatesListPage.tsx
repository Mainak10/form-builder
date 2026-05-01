// src/pages/TemplatesListPage.tsx
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getAllTemplates, deleteTemplate } from '@/storage'
import type { StoredTemplate } from '@/types'
import styles from './TemplatesListPage.module.css'

export default function TemplatesListPage() {
  const [templates, setTemplates] = useState<StoredTemplate[]>([])

  useEffect(() => {
    setTemplates(getAllTemplates())
  }, [])

  function handleDelete(id: string) {
    if (!confirm('Delete this template and all its responses?')) return
    deleteTemplate(id)
    setTemplates(prev => prev.filter(t => t.schema.id !== id))
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <span className={styles.appName}>Form Builder</span>
        <Link to="/builder/new" className={styles.newBtn}>+ New Form</Link>
      </header>

      <main className={styles.main}>
        <h1 className={styles.pageTitle}>My Forms</h1>

        {templates.length === 0 ? (
          <div className={styles.empty}>
            <span className={styles.emptyIcon}>📝</span>
            <p style={{ fontSize: 16 }}>No forms yet</p>
            <Link to="/builder/new" className={styles.newBtn}>Create your first form</Link>
          </div>
        ) : (
          <div className={styles.grid}>
            {templates.map(({ schema, responseCount }) => (
              <div key={schema.id} className={styles.card}>
                <div className={styles.cardTitle}>{schema.title}</div>
                <div className={styles.cardMeta}>
                  <span>{schema.fields.length} field{schema.fields.length !== 1 ? 's' : ''}</span>
                  <span>{responseCount} response{responseCount !== 1 ? 's' : ''}</span>
                  <span>Updated {new Date(schema.updatedAt).toLocaleDateString()}</span>
                </div>
                <div className={styles.cardActions}>
                  <Link to={`/fill/${schema.id}`} className={`${styles.actionLink} ${styles.actionLinkPrimary}`}>Fill</Link>
                  <Link to={`/builder/${schema.id}`} className={styles.actionLink}>Edit</Link>
                  {responseCount > 0 && (
                    <Link to={`/templates/${schema.id}/responses`} className={styles.actionLink}>Responses</Link>
                  )}
                  <button className={styles.deleteBtn} onClick={() => handleDelete(schema.id)} title="Delete">🗑</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
