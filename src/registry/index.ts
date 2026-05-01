import type { FieldConfig, FieldKind, FieldValue, SchemaError } from '@/types'
import type { ReactNode } from 'react'

export interface RendererProps<C extends FieldConfig, V extends FieldValue> {
  config: C
  value: V
  onChange: (value: V) => void
  onBlur?: () => void
  error?: string
  isTouched: boolean
  isSubmitted: boolean
  isDisabled?: boolean
}

export interface EditorProps<C extends FieldConfig> {
  config: C
  onChange: (config: C) => void
}

export interface FieldRegistration<
  C extends FieldConfig = FieldConfig,
  V extends FieldValue = FieldValue
> {
  kind: FieldKind
  paletteLabel: string
  icon: string
  createDefaultConfig: (id: string) => C
  createDefaultValue: (config: C) => V
  Renderer: (props: RendererProps<C, V>) => ReactNode
  Editor: (props: EditorProps<C>) => ReactNode
  validate: (config: C, value: V, isRequired: boolean) => string | null
}

const registry = new Map<FieldKind, FieldRegistration>()

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function registerField(reg: FieldRegistration<any, any>): void {
  registry.set(reg.kind, reg)
}

export function getField(kind: FieldKind): FieldRegistration {
  const reg = registry.get(kind)
  if (!reg) throw new Error(`No registration for field kind: ${kind}`)
  return reg
}

export function getAllFields(): FieldRegistration[] {
  return Array.from(registry.values())
}

export function validateField(
  config: FieldConfig,
  value: FieldValue,
  isRequired: boolean
): SchemaError | null {
  const reg = getField(config.kind)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const message = reg.validate(config as any, value as any, isRequired)
  if (message) return { fieldId: config.id, message }
  return null
}
