import { Link } from 'react-router-dom'
import styles from './NotFoundPage.module.css'

export default function NotFoundPage() {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <span className={styles.appName}>Form Builder</span>
        <Link to="/builder/new" className={styles.newBtn}>+ New Form</Link>
      </header>

      <main className={styles.main}>
        <div className={styles.card}>
          <div className={styles.code}>404</div>
          <h1 className={styles.heading}>Page not found</h1>
          <p className={styles.description}>
            The URL you visited doesn't exist or may have been moved.
          </p>
          <Link to="/" className={styles.homeLink}>← Back to home</Link>
        </div>
      </main>
    </div>
  )
}
