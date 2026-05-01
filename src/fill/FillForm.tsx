// src/fill/FillForm.tsx
import type { FillState, FillAction } from './FillReducer'
import { getField } from '@/registry'
import type { FieldValue } from '@/types'
import styles from './FillForm.module.css'

interface Props {
  state: FillState
  dispatch: React.Dispatch<FillAction>
  onSubmit: () => void
}

export default function FillForm({ state, dispatch, onSubmit }: Props) {
  const visibleFields = state.schema.fields.filter(f => state.visibility[f.id] !== false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onSubmit()
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      {visibleFields.map(config => {
        const reg = getField(config.kind)
        const value = state.values[config.id] ?? reg.createDefaultValue(config as never)
        const error = state.errors[config.id]
        const isTouched = !!state.touched[config.id]

        // Apply required override from conditional logic effect
        const requiredOverride = state.requiredOverrides[config.id]
        const effectiveConfig = requiredOverride != null
          ? { ...config, required: requiredOverride }
          : config

        return (
          <reg.Renderer
            key={config.id}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            config={effectiveConfig as any}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            value={value as any}
            onChange={(val: FieldValue) => dispatch({ type: 'VALUE_CHANGE', fieldId: config.id, value: val })}
            error={error}
            isTouched={isTouched}
            isSubmitted={state.isSubmitted}
            onBlur={() => dispatch({ type: 'FIELD_BLUR', fieldId: config.id })}
          />
        )
      })}
      <button type="submit" className={styles.submitBtn}>Submit</button>
    </form>
  )
}
