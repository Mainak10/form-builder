import { getAllFields } from '@/registry'
import type { FieldKind } from '@/types'
import styles from './FieldPalette.module.css'

interface Props {
  onAddField: (kind: FieldKind) => void
}

export default function FieldPalette({ onAddField }: Props) {
  const registrations = getAllFields()

  return (
    <aside className={styles.palette}>
      <div className={styles.title}>Add Field</div>
      {registrations.map(reg => (
        <button
          key={reg.kind}
          className={styles.fieldBtn}
          onClick={() => onAddField(reg.kind)}
          title={`Add ${reg.paletteLabel}`}
        >
          <span className={styles.icon}>{reg.icon}</span>
          {reg.paletteLabel}
        </button>
      ))}
    </aside>
  )
}
