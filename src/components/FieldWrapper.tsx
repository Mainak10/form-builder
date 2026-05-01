import type { ReactNode } from 'react'
import styles from './FieldWrapper.module.css'

interface Props {
  label: string
  required: boolean
  hint?: string
  error?: string
  showError: boolean
  children: ReactNode
  htmlFor?: string
}

export default function FieldWrapper({ label, required, hint, error, showError, children, htmlFor }: Props) {
  return (
    <div className={styles.wrapper}>
      <label className={styles.label} htmlFor={htmlFor}>
        {label}
        {required && <span className={styles.required} aria-hidden>*</span>}
      </label>
      {hint && <p className={styles.hint}>{hint}</p>}
      {children}
      {showError && error && <p className={styles.error} role="alert">{error}</p>}
    </div>
  )
}
