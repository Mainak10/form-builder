import type { FieldConfig, FormSchema } from '@/types'
import { getField } from '@/registry'
import ConditionalLogicEditor from './ConditionalLogicEditor'
import type { BuilderAction } from './BuilderReducer'
import styles from './ConfigPanel.module.css'

interface Props {
  selectedField: FieldConfig | null
  schema: FormSchema
  dispatch: React.Dispatch<BuilderAction>
}

export default function ConfigPanel({ selectedField, schema, dispatch }: Props) {
  if (!selectedField) {
    return (
      <aside className={styles.panel}>
        <div className={styles.empty}>
          <span style={{ fontSize: 24 }}>←</span>
          <p>Select a field to configure it</p>
        </div>
      </aside>
    )
  }

  const reg = getField(selectedField.kind)

  function updateConfig(config: FieldConfig) {
    dispatch({ type: 'FIELD_UPDATE', config })
  }

  const isSectionHeader = selectedField.kind === 'section_header'

  return (
    <aside className={styles.panel}>
      <div className={styles.section}>
        <div className={styles.sectionTitle}>Field Settings</div>

        <div className={styles.row}>
          <label className={styles.label} htmlFor="cfg-label">Label</label>
          <input
            id="cfg-label"
            className={styles.input}
            value={selectedField.label}
            onChange={e => updateConfig({ ...selectedField, label: e.target.value })}
          />
        </div>

        {!isSectionHeader && (
          <div className={styles.row}>
            <label className={styles.label} htmlFor="cfg-hint">Hint (optional)</label>
            <input
              id="cfg-hint"
              className={styles.input}
              value={selectedField.hint ?? ''}
              onChange={e => updateConfig({ ...selectedField, hint: e.target.value || undefined })}
              placeholder="Shown below the field"
            />
          </div>
        )}

        {!isSectionHeader && selectedField.kind !== 'calculation' && (
          <label className={styles.checkRow}>
            <input
              type="checkbox"
              checked={selectedField.required}
              onChange={e => updateConfig({ ...selectedField, required: e.target.checked })}
            />
            Required
          </label>
        )}
      </div>

      <div className={styles.section}>
        <div className={styles.sectionTitle}>Field Options</div>
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        <reg.Editor config={selectedField as any} onChange={config => updateConfig(config as FieldConfig)} />
      </div>

      {!isSectionHeader && (
        <div className={styles.section}>
          <div className={styles.sectionTitle}>Conditional Logic</div>
          <ConditionalLogicEditor
            fieldId={selectedField.id}
            schema={schema}
            onUpdateRule={(fieldId, rule) => dispatch({ type: 'RULE_UPDATE', fieldId, rule })}
            onDeleteRule={fieldId => dispatch({ type: 'RULE_DELETE', fieldId })}
          />
        </div>
      )}
    </aside>
  )
}
