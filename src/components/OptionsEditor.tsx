import type { SelectOption } from '@/types'
import styles from './OptionsEditor.module.css'

interface Props {
  options: SelectOption[]
  onChange: (options: SelectOption[]) => void
}

function generateId(): string {
  return Math.random().toString(36).slice(2, 10)
}

export default function OptionsEditor({ options, onChange }: Props) {
  function addOption() {
    onChange([...options, { id: generateId(), label: '' }])
  }

  function updateLabel(id: string, label: string) {
    onChange(options.map(o => o.id === id ? { ...o, label } : o))
  }

  function removeOption(id: string) {
    onChange(options.filter(o => o.id !== id))
  }

  function moveUp(index: number) {
    if (index === 0) return
    const next = [...options]
    ;[next[index - 1], next[index]] = [next[index], next[index - 1]]
    onChange(next)
  }

  function moveDown(index: number) {
    if (index === options.length - 1) return
    const next = [...options]
    ;[next[index], next[index + 1]] = [next[index + 1], next[index]]
    onChange(next)
  }

  return (
    <div>
      <div className={styles.list}>
        {options.map((opt, i) => (
          <div key={opt.id} className={styles.row}>
            <input
              className={styles.input}
              value={opt.label}
              onChange={e => updateLabel(opt.id, e.target.value)}
              placeholder={`Option ${i + 1}`}
            />
            <button className={styles.iconBtn} onClick={() => moveUp(i)} title="Move up" disabled={i === 0}>↑</button>
            <button className={styles.iconBtn} onClick={() => moveDown(i)} title="Move down" disabled={i === options.length - 1}>↓</button>
            <button className={styles.iconBtn} onClick={() => removeOption(opt.id)} title="Remove">✕</button>
          </div>
        ))}
      </div>
      <button className={styles.addBtn} onClick={addOption}>+ Add option</button>
    </div>
  )
}
