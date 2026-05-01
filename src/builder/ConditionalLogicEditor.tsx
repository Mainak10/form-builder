import type { FormSchema, FieldConfig, ConditionalRule, Condition, ConditionOperator } from '@/types'

function generateId(): string {
  return `cond_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
}

function getOperatorsForKind(kind: FieldConfig['kind']): { value: ConditionOperator; label: string }[] {
  const base = [
    { value: 'is_filled' as ConditionOperator, label: 'is filled' },
    { value: 'is_empty' as ConditionOperator, label: 'is empty' },
  ]
  switch (kind) {
    case 'single_line':
    case 'multi_line':
      return [...base,
        { value: 'equals' as ConditionOperator, label: 'equals' },
        { value: 'not_equals' as ConditionOperator, label: 'does not equal' },
        { value: 'contains' as ConditionOperator, label: 'contains' },
        { value: 'not_contains' as ConditionOperator, label: 'does not contain' },
      ]
    case 'number':
      return [...base,
        { value: 'equals' as ConditionOperator, label: 'equals' },
        { value: 'not_equals' as ConditionOperator, label: 'does not equal' },
        { value: 'greater_than' as ConditionOperator, label: 'is greater than' },
        { value: 'less_than' as ConditionOperator, label: 'is less than' },
      ]
    case 'date':
      return [...base,
        { value: 'equals' as ConditionOperator, label: 'equals (date)' },
        { value: 'before' as ConditionOperator, label: 'is before' },
        { value: 'after' as ConditionOperator, label: 'is after' },
      ]
    case 'single_select':
      return [...base,
        { value: 'includes_option' as ConditionOperator, label: 'is' },
        { value: 'excludes_option' as ConditionOperator, label: 'is not' },
      ]
    case 'multi_select':
      return [...base,
        { value: 'includes_option' as ConditionOperator, label: 'includes' },
        { value: 'excludes_option' as ConditionOperator, label: 'excludes' },
      ]
    default:
      return base
  }
}

function needsValue(op: ConditionOperator): boolean {
  return !['is_filled', 'is_empty'].includes(op)
}

function ConditionRow({
  condition,
  schema,
  currentFieldId,
  onChange,
  onDelete,
}: {
  condition: Condition
  schema: FormSchema
  currentFieldId: string
  onChange: (c: Condition) => void
  onDelete: () => void
}) {
  const eligibleFields = schema.fields.filter(f =>
    f.id !== currentFieldId &&
    f.kind !== 'section_header' &&
    f.kind !== 'calculation'
  )
  const targetField = schema.fields.find(f => f.id === condition.targetFieldId)
  const operators = targetField ? getOperatorsForKind(targetField.kind) : []
  const showValue = needsValue(condition.operator)

  const selectStyle = { padding: '5px 8px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', fontSize: 13, background: 'var(--bg)', color: 'var(--text)' } as const
  const inputStyle = { ...selectStyle, minWidth: 80 }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' as const }}>
      <select
        value={condition.targetFieldId}
        onChange={e => onChange({ ...condition, targetFieldId: e.target.value, operator: 'is_filled', value: undefined })}
        style={selectStyle}
      >
        <option value="">— field —</option>
        {eligibleFields.map(f => <option key={f.id} value={f.id}>{f.label || f.kind}</option>)}
      </select>
      {targetField && (
        <select
          value={condition.operator}
          onChange={e => onChange({ ...condition, operator: e.target.value as ConditionOperator, value: undefined })}
          style={selectStyle}
        >
          {operators.map(op => <option key={op.value} value={op.value}>{op.label}</option>)}
        </select>
      )}
      {targetField && showValue && (
        <>
          {(targetField.kind === 'single_select' || targetField.kind === 'multi_select') ? (
            <select
              value={String(condition.value ?? '')}
              onChange={e => onChange({ ...condition, value: e.target.value })}
              style={selectStyle}
            >
              <option value="">— option —</option>
              {(targetField as { options: { id: string; label: string }[] }).options.map(o => (
                <option key={o.id} value={o.id}>{o.label}</option>
              ))}
            </select>
          ) : (
            <input
              type={targetField.kind === 'number' ? 'number' : targetField.kind === 'date' ? 'date' : 'text'}
              value={String(condition.value ?? '')}
              onChange={e => onChange({ ...condition, value: targetField.kind === 'number' ? Number(e.target.value) : e.target.value })}
              style={inputStyle}
              placeholder="value"
            />
          )}
        </>
      )}
      <button onClick={onDelete} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 16, padding: '2px 4px' }}>✕</button>
    </div>
  )
}

interface Props {
  fieldId: string
  schema: FormSchema
  onUpdateRule: (fieldId: string, rule: ConditionalRule) => void
  onDeleteRule: (fieldId: string) => void
}

export default function ConditionalLogicEditor({ fieldId, schema, onUpdateRule, onDeleteRule }: Props) {
  const rule = schema.conditionalRules[fieldId]

  if (!rule) {
    return (
      <button
        onClick={() => onUpdateRule(fieldId, { logic: 'AND', conditions: [{ id: generateId(), targetFieldId: '', operator: 'is_filled' }] })}
        style={{ padding: '6px 12px', border: '1px dashed var(--border)', borderRadius: 'var(--radius)', background: 'none', cursor: 'pointer', fontSize: 13, color: 'var(--text-muted)', width: '100%' }}
      >
        + Add conditional rule
      </button>
    )
  }

  function updateCondition(index: number, updated: Condition) {
    const conditions = rule.conditions.map((c, i) => i === index ? updated : c)
    onUpdateRule(fieldId, { ...rule, conditions })
  }

  function deleteCondition(index: number) {
    const conditions = rule.conditions.filter((_, i) => i !== index)
    if (conditions.length === 0) { onDeleteRule(fieldId); return }
    onUpdateRule(fieldId, { ...rule, conditions })
  }

  function addCondition() {
    const conditions = [...rule.conditions, { id: generateId(), targetFieldId: '', operator: 'is_filled' as ConditionOperator }]
    onUpdateRule(fieldId, { ...rule, conditions })
  }

  const infoStyle = { fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <p style={infoStyle}>Show this field when:</p>
      {rule.conditions.map((c, i) => (
        <ConditionRow
          key={c.id}
          condition={c}
          schema={schema}
          currentFieldId={fieldId}
          onChange={updated => updateCondition(i, updated)}
          onDelete={() => deleteCondition(i)}
        />
      ))}
      {rule.conditions.length > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Match:</span>
          {(['AND', 'OR'] as const).map(logic => (
            <label key={logic} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, cursor: 'pointer' }}>
              <input type="radio" name={`logic-${fieldId}`} value={logic} checked={rule.logic === logic}
                onChange={() => onUpdateRule(fieldId, { ...rule, logic })} />
              {logic === 'AND' ? 'All conditions' : 'Any condition'}
            </label>
          ))}
        </div>
      )}
      <button
        onClick={addCondition}
        style={{ padding: '4px 10px', border: '1px dashed var(--border)', borderRadius: 'var(--radius)', background: 'none', cursor: 'pointer', fontSize: 12, color: 'var(--text-muted)', alignSelf: 'flex-start' }}
      >
        + Add condition
      </button>
      <button
        onClick={() => onDeleteRule(fieldId)}
        style={{ padding: '4px 10px', border: 'none', borderRadius: 'var(--radius)', background: 'none', cursor: 'pointer', fontSize: 12, color: 'var(--danger)', alignSelf: 'flex-start' }}
      >
        Remove rule
      </button>
    </div>
  )
}
