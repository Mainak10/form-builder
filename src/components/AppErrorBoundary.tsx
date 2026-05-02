import { Component } from 'react'
import type { ReactNode, ErrorInfo } from 'react'
import styles from './AppErrorBoundary.module.css'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export default class AppErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[AppErrorBoundary]', error, info)
  }

  render() {
    if (!this.state.hasError) return this.props.children

    const { error } = this.state

    return (
      <div className={styles.page}>
        <div className={styles.card}>
          <div className={styles.icon}>⚠</div>
          <h1 className={styles.heading}>Something went wrong</h1>
          <p className={styles.description}>
            An unexpected error occurred. You can try reloading the page or go back to home.
          </p>

          {error && (
            <details className={styles.details}>
              <summary className={styles.summary}>Error details</summary>
              <pre className={styles.stack}>
                {error.message}
                {error.stack ? '\n\n' + error.stack : ''}
              </pre>
            </details>
          )}

          <div className={styles.actions}>
            <button className={styles.reloadBtn} onClick={() => window.location.reload()}>
              Reload page
            </button>
            <a className={styles.homeLink} href="/">← Go home</a>
          </div>
        </div>
      </div>
    )
  }
}
