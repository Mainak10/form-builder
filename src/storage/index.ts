import type { FormSchema, FormResponse, StoredTemplate } from '@/types'

const VERSION_KEY = 'fb:version'
const TEMPLATES_KEY = 'fb:templates'
const CURRENT_VERSION = 1

function safeSetItem(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value)
    return true
  } catch (e) {
    if (e instanceof DOMException && e.name === 'QuotaExceededError') {
      console.error('localStorage quota exceeded')
    }
    return false
  }
}

export function initStorage(): void {
  const stored = localStorage.getItem(VERSION_KEY)
  if (!stored) {
    safeSetItem(VERSION_KEY, String(CURRENT_VERSION))
    return
  }
  const version = parseInt(stored, 10)
  if (version < CURRENT_VERSION) {
    // Future migrations go here
    safeSetItem(VERSION_KEY, String(CURRENT_VERSION))
  }
}

function getTemplatesMap(): Record<string, StoredTemplate> {
  const raw = localStorage.getItem(TEMPLATES_KEY)
  if (!raw) return {}
  try { return JSON.parse(raw) as Record<string, StoredTemplate> }
  catch { return {} }
}

function saveTemplatesMap(map: Record<string, StoredTemplate>): boolean {
  return safeSetItem(TEMPLATES_KEY, JSON.stringify(map))
}

// ─── Templates ─────────────────────────────────────────────────────────────────
export function getAllTemplates(): StoredTemplate[] {
  return Object.values(getTemplatesMap())
}

export function getTemplate(id: string): StoredTemplate | null {
  return getTemplatesMap()[id] ?? null
}

export function saveTemplate(schema: FormSchema): boolean {
  const map = getTemplatesMap()
  const existing = map[schema.id]
  map[schema.id] = {
    schema,
    responseCount: existing?.responseCount ?? 0,
  }
  return saveTemplatesMap(map)
}

export function deleteTemplate(id: string): void {
  const map = getTemplatesMap()
  delete map[id]
  saveTemplatesMap(map)
  localStorage.removeItem(responsesKey(id))
}

// ─── Responses ─────────────────────────────────────────────────────────────────
function responsesKey(templateId: string): string {
  return `fb:responses:${templateId}`
}

function getResponsesMap(templateId: string): Record<string, FormResponse> {
  const raw = localStorage.getItem(responsesKey(templateId))
  if (!raw) return {}
  try { return JSON.parse(raw) as Record<string, FormResponse> }
  catch { return {} }
}

export function getResponses(templateId: string): FormResponse[] {
  return Object.values(getResponsesMap(templateId)).sort(
    (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
  )
}

export function saveResponse(response: FormResponse): boolean {
  const map = getResponsesMap(response.templateId)
  map[response.id] = response

  const ok = safeSetItem(responsesKey(response.templateId), JSON.stringify(map))
  if (!ok) return false

  const templates = getTemplatesMap()
  const tmpl = templates[response.templateId]
  if (tmpl) {
    tmpl.responseCount = Object.keys(map).length
    saveTemplatesMap(templates)
  }
  return true
}

export function deleteResponse(templateId: string, responseId: string): void {
  const map = getResponsesMap(templateId)
  delete map[responseId]
  safeSetItem(responsesKey(templateId), JSON.stringify(map))

  const templates = getTemplatesMap()
  const tmpl = templates[templateId]
  if (tmpl) {
    tmpl.responseCount = Object.keys(map).length
    saveTemplatesMap(templates)
  }
}
