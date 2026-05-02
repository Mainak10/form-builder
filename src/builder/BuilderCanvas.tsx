import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { FieldConfig, FormSchema } from '@/types'
import styles from './BuilderCanvas.module.css'

interface SortableFieldCardProps {
  config: FieldConfig
  isSelected: boolean
  hasRule: boolean
  fieldError?: string
  onSelect: () => void
  onDelete: () => void
}

function SortableFieldCard({ config, isSelected, hasRule, fieldError, onSelect, onDelete }: SortableFieldCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: config.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const kindLabel = config.kind.replace(/_/g, ' ')

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`${styles.fieldCard} ${isSelected ? styles.selected : ''} ${isDragging ? styles.dragging : ''} ${fieldError ? styles.hasError : ''}`}
      onClick={onSelect}
    >
      <div className={styles.cardHeader}>
        <span className={styles.dragHandle} {...attributes} {...listeners} onClick={e => e.stopPropagation()}>⠿</span>
        <span className={styles.fieldKindBadge}>{kindLabel}</span>
        <button
          className={styles.deleteBtn}
          onClick={e => { e.stopPropagation(); onDelete() }}
          title="Delete field"
        >
          ✕
        </button>
      </div>
      <div className={styles.fieldLabel}>{config.label || <em style={{ color: 'var(--text-muted)' }}>Untitled</em>}</div>
      {hasRule && <div className={styles.hasRule}>⚡ Has conditional rule</div>}
      {fieldError && <div className={styles.fieldError}>⚠ {fieldError}</div>}
    </div>
  )
}

interface Props {
  schema: FormSchema
  selectedFieldId: string | null
  fieldErrors: Record<string, string>
  onSelectField: (id: string | null) => void
  onDeleteField: (id: string) => void
  onReorder: (fromIndex: number, toIndex: number) => void
}

export default function BuilderCanvas({ schema, selectedFieldId, fieldErrors, onSelectField, onDeleteField, onReorder }: Props) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const fromIndex = schema.fields.findIndex(f => f.id === active.id)
    const toIndex = schema.fields.findIndex(f => f.id === over.id)
    if (fromIndex !== -1 && toIndex !== -1) onReorder(fromIndex, toIndex)
  }

  if (schema.fields.length === 0) {
    return (
      <main className={styles.canvas}>
        <div className={styles.empty}>
          <span className={styles.emptyIcon}>+</span>
          <p>Click a field type on the left to add it here</p>
        </div>
      </main>
    )
  }

  return (
    <main className={styles.canvas}>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={schema.fields.map(f => f.id)} strategy={verticalListSortingStrategy}>
          {schema.fields.map(config => (
            <SortableFieldCard
              key={config.id}
              config={config}
              isSelected={selectedFieldId === config.id}
              hasRule={!!schema.conditionalRules[config.id]?.conditions.length}
              fieldError={fieldErrors[config.id]}
              onSelect={() => onSelectField(config.id)}
              onDelete={() => onDeleteField(config.id)}
            />
          ))}
        </SortableContext>
      </DndContext>
    </main>
  )
}
