# Form Builder — Implementation Plan

> Track progress by checking off tasks as you complete them. Update this doc freely as you go.

**Stack:** React 19 · TypeScript · Vite · react-router-dom v6 · @dnd-kit · localStorage · CSS Modules · `window.print()` PDF

---

## Phase 1 — Foundation

### Task 1: Project Setup
- [x] Install deps: `npm install react-router-dom @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities`
- [x] Add `@` path alias in `vite.config.ts` (import path from 'path', resolve.alias `@` → `./src`)
- [x] Add `baseUrl` + `paths` for `@/*` in `tsconfig.app.json`
- [x] Replace `src/App.tsx` with minimal shell (`<div>Form Builder</div>`)
- [x] Clean up `src/index.css` — keep CSS vars, remove boilerplate body styles
- [x] Update `index.html` title to "Form Builder"
- [x] **Verify:** `npm run dev` loads, `npm run build` passes

---

### Task 2: TypeScript Type Contracts
**File:** `src/types/index.ts`

Types to define:
- `FieldKind` — union of 9 string literals
- `FieldConfig` — discriminated union (one interface per kind, all extend `FieldConfigBase`)
- `SelectOption` `{ id, label }`
- `Condition` + `ConditionalRule` + `ConditionLogic` ('AND' | 'OR')
- `FieldValue` — discriminated union mirroring configs
- `FileMetadata` `{ name, size, type, lastModified }`
- `FormSchema` `{ id, title, description, fields[], conditionalRules{}, createdAt, updatedAt }`
- `FormResponse` `{ id, templateId, schemaSnapshot, values, visibleFieldIds, fieldLabelSnapshot, submittedAt }`
- `StoredTemplate` `{ schema, responseCount }`
- `VisibilityState` — `Record<string, boolean>`
- `SchemaError` `{ fieldId?, message }`

- [x] **Verify:** `npm run build` passes with 0 errors

---

### Task 3: Component Registry
**Files:** `src/registry/index.ts` · `src/registry/register.ts`

- [x] Define `RendererProps<C, V>` interface (config, value, onChange, onBlur?, error, isTouched, isSubmitted, isDisabled?)
- [x] Define `EditorProps<C>` interface (config, onChange, schema?)
- [x] Define `FieldRegistration<C, V>` interface (kind, paletteLabel, icon, createDefaultConfig, createDefaultValue, Renderer, Editor, validate)
- [x] Create `registry` Map + `registerField`, `getField`, `getAllFields`, `validateField` helpers
- [x] Create stub `register.ts` (`export {}` — imports added in Task 13)
- [x] Import `register.ts` as side-effect in `src/main.tsx`
- [x] **Verify:** `npm run build` passes

---

### Task 4: Storage Service
**File:** `src/storage/index.ts`

- [x] `safeSetItem(key, value)` — catches `QuotaExceededError`
- [x] `initStorage()` — checks/writes `fb:version`, runs future migrations
- [x] Templates: `getAllTemplates`, `getTemplate`, `saveTemplate`, `deleteTemplate`
- [x] Responses: `getResponses` (sorted by date desc), `saveResponse` (updates denormalized responseCount), `deleteResponse`
- [x] Call `initStorage()` in `src/main.tsx` before render
- [x] **Verify:** `npm run build` passes

---

### Task 5: Routing + Page Shells
**Files:** `src/router/index.tsx` · `src/pages/*.tsx` (4 files) · `src/App.tsx`

Routes:
| Path | Component |
|------|-----------|
| `/` | `TemplatesListPage` |
| `/builder/new` | `BuilderPage` |
| `/builder/:templateId` | `BuilderPage` |
| `/fill/:templateId` | `FillPage` |
| `/templates/:templateId/responses` | `InstancesListPage` |

- [x] Create 4 placeholder page components (just render heading + route param)
- [x] Create `src/router/index.tsx` with `createBrowserRouter`
- [x] Replace `App.tsx` with `<RouterProvider router={router} />`
- [x] **Verify:** All 4 routes render in browser without errors

---

## Phase 2 — Shared UI

### Task 6: Shared Components
**Files:** `src/components/FieldWrapper.tsx` + `.module.css` · `src/components/OptionsEditor.tsx` + `.module.css`

**FieldWrapper** (mandatory shell for every field in fill mode):
- Props: `label`, `required`, `hint?`, `error?`, `showError`, `children`, `htmlFor?`
- Renders: label + asterisk (if required) + hint + children + error (gated by `showError`)

**OptionsEditor** (reused by SingleSelect + MultiSelect editors):
- Props: `options: SelectOption[]`, `onChange`
- Renders: list of inputs with ↑ ↓ ✕ per row + "Add option" button

- [x] **Verify:** `npm run build` passes

---

## Phase 3 — Field Implementations

Each field file exports one `*Registration` object conforming to `FieldRegistration`.

### Task 7: SingleLine + MultiLine
**Files:** `src/fields/SingleLineField.tsx` · `src/fields/MultiLineField.tsx`

- [x] `SingleLineField` — `<input type="text">`, editor has placeholder + maxLength
- [x] `MultiLineField` — `<textarea>`, editor has placeholder + rows
- [x] validate: required → non-empty check
- [x] **Verify:** `npm run build` passes

---

### Task 8: Number + Date
**Files:** `src/fields/NumberField.tsx` · `src/fields/DateField.tsx`

- [x] `NumberField` — `<input type="text" inputMode="decimal">`, parse on blur, editor has min/max/decimalPlaces
- [x] `DateField` — `<input type="date">`, `createDefaultValue` applies `prefillToday` via `todayISO()`, editor has prefillToday checkbox
- [x] validate Number: required, min, max
- [x] validate Date: required → non-empty
- [x] **Verify:** `npm run build` passes

---

### Task 9: SingleSelect
**File:** `src/fields/SingleSelectField.tsx`

- [x] Three display modes in one Renderer: `radio` | `dropdown` | `tiles`
- [x] Editor: displayType `<select>` + `<OptionsEditor>`
- [x] validate: required → non-empty value
- [x] **Verify:** `npm run build` passes

---

### Task 10: MultiSelect
**File:** `src/fields/MultiSelectField.tsx`

- [x] Render checkboxes; hard-cap `maxSelections` (disable unchecked options when at max)
- [x] Editor: minSelections + maxSelections inputs + `<OptionsEditor>`
- [x] validate: required → at least 1; minSelections soft check on submit
- [x] **Verify:** `npm run build` passes

---

### Task 11: FileUpload
**File:** `src/fields/FileUploadField.tsx`

- [x] Drag-and-drop zone + click-to-browse (`<input type="file" style display:none>`)
- [x] Store `FileMetadata[]` only (no actual file blobs)
- [x] Filter files exceeding `maxFileSizeMB` on drop/select
- [x] Editor: maxFileSizeMB + acceptedTypes (comma-separated string)
- [x] validate: required → at least 1 file
- [x] **Verify:** `npm run build` passes

---

### Task 12: SectionHeader + Calculation
**Files:** `src/fields/SectionHeaderField.tsx` · `src/fields/CalculationField.tsx`

- [x] `SectionHeaderField` — renders `<h1>`–`<h6>` based on `size` config + optional description; `validate` always returns null
- [x] `CalculationField` — Renderer has 3 display states: no sources configured / null (sources unfilled) / computed number; Editor has operation select + decimalPlaces + source field checkboxes (number fields only)
- [x] **Verify:** `npm run build` passes

---

### Task 13: Register All Fields
**File:** `src/registry/register.ts`

- [x] Import all 9 `*Registration` exports and call `registerField()` for each
- [x] **Verify:** `npm run build` passes, no console errors on page load

---

## Phase 4 — Logic Engines

### Task 14: Conditional Logic Engine
**File:** `src/engines/conditionalLogicEngine.ts`

Pure function: `runConditionalLogicEngine(schema, values) → VisibilityState`

- [ ] Iterate schema fields; if no rule → `visible = true`
- [ ] Evaluate each condition against the target field's current value
- [ ] Operator support per field kind:
  - text: `is_filled`, `is_empty`, `equals`, `not_equals`, `contains`, `not_contains`
  - number: `is_filled`, `is_empty`, `equals`, `not_equals`, `greater_than`, `less_than`
  - date: `is_filled`, `is_empty`, `equals`, `before`, `after`
  - single_select: `is_filled`, `is_empty`, `equals`, `not_equals`, `includes_option`, `excludes_option`
  - multi_select: `is_filled`, `is_empty`, `includes_option`, `excludes_option`
  - file_upload: `is_filled`, `is_empty`
- [ ] AND → all conditions true; OR → any condition true
- [ ] **Verify:** `npm run build` passes

---

### Task 15: Calculation Engine
**File:** `src/engines/calculationEngine.ts`

Pure function: `runCalculationEngine(schema, values, visibility) → Record<string, number | null>`

- [ ] For each `calculation` field: collect `sourceFieldIds`
- [ ] Exclude: hidden source fields, source fields that are themselves calculations (no chaining)
- [ ] If no valid sources → `null`; else compute sum/average/product, round to `decimalPlaces`
- [ ] **Verify:** `npm run build` passes

---

## Phase 5 — Builder Mode

### Task 16: BuilderReducer
**File:** `src/builder/BuilderReducer.ts`

State: `{ schema, selectedFieldId, isDirty, schemaErrors }`

Actions:
| Action | Description |
|--------|-------------|
| `FIELD_ADD` | create default config via registry, append to fields, select it |
| `FIELD_UPDATE` | replace config; if kind changed → cascade-cleanup orphaned conditions |
| `FIELD_DELETE` | remove field + its rule + any conditions targeting it; deselect |
| `FIELD_REORDER` | swap fields at fromIndex / toIndex |
| `FIELD_SELECT` | set selectedFieldId |
| `FORM_UPDATE` | update title + description |
| `RULE_UPDATE` | upsert conditional rule for fieldId |
| `RULE_DELETE` | remove conditional rule for fieldId |
| `SAVE_SUCCESS` | set isDirty = false |
| `LOAD_SCHEMA` | hydrate from storage, isDirty = false |

Schema validation (runs after every action):
- Title non-empty
- Non-section-header fields have non-empty labels
- Select fields have ≥1 option
- Calculation fields have ≥1 source

- [ ] `createInitialBuilderState(schema?)` factory
- [ ] **Verify:** `npm run build` passes

---

### Task 17: FieldPalette
**Files:** `src/builder/FieldPalette.tsx` + `.module.css`

- [ ] Reads `getAllFields()` from registry — no hardcoded list
- [ ] Renders a button per field type (icon + label)
- [ ] Props: `onAddField(kind)`
- [ ] **Verify:** `npm run build` passes

---

### Task 18: BuilderCanvas
**Files:** `src/builder/BuilderCanvas.tsx` + `.module.css`

- [ ] Empty state: message to click palette items
- [ ] Each field renders as a draggable card (via `@dnd-kit/sortable`)
  - drag handle ⠿ · kind badge · field label · ✕ delete button
  - "⚡ Has conditional rule" indicator
  - selected state styling (accent border + bg)
- [ ] `DndContext` + `SortableContext` wiring → fires `onReorder(fromIndex, toIndex)` on drag end
- [ ] Props: `schema`, `selectedFieldId`, `onSelectField`, `onDeleteField`, `onReorder`
- [ ] **Verify:** `npm run build` passes

---

### Task 19: ConditionalLogicEditor
**File:** `src/builder/ConditionalLogicEditor.tsx`

- [ ] No rule → "Add conditional rule" button
- [ ] With rule: one row per condition (target field select → operator select → value input/select)
- [ ] Operator list is dynamic based on the target field's kind (see Task 14 operator table)
- [ ] For select field values, render a `<select>` of that field's options
- [ ] AND/OR toggle visible only when ≥2 conditions
- [ ] "Add condition" + "Remove rule" buttons
- [ ] Props: `fieldId`, `schema`, `onUpdateRule`, `onDeleteRule`
- [ ] **Verify:** `npm run build` passes

---

### Task 20: ConfigPanel
**Files:** `src/builder/ConfigPanel.tsx` + `.module.css`

- [ ] Empty state when no field selected
- [ ] When field selected, three sections:
  1. **Field Settings** — label input, hint input (not for section_header), required checkbox (not for section_header/calculation)
  2. **Field Options** — renders `reg.Editor` for the selected field
  3. **Conditional Logic** — renders `<ConditionalLogicEditor>` (not for section_header)
- [ ] Props: `selectedField`, `schema`, `dispatch`
- [ ] **Verify:** `npm run build` passes

---

### Task 21: Builder Page Assembly
**Files:** `src/pages/BuilderPage.tsx` + `.module.css`

Layout: 3-panel (`FieldPalette` | `BuilderCanvas` | `ConfigPanel`) with fixed header

Header:
- ← Templates link
- Title `<input>` (edits schema.title via FORM_UPDATE)
- Error count badge (shows when schemaErrors.length > 0)
- Preview button (opens modal with all fields rendered in disabled mode)
- Save button (disabled when not dirty; validates before saving)

Behaviors:
- [ ] Load existing template from storage on mount (if `:templateId` param present)
- [ ] `beforeunload` event guard when `isDirty`
- [ ] On save success: redirect `/builder/new` → `/builder/:id` (replace history)
- [ ] Preview modal: renders each field via `reg.Renderer` with `isDisabled=true` and default values

- [ ] **Verify in browser:**
  - Add fields via palette → appear in canvas
  - Select field → ConfigPanel opens
  - Edit label → card updates
  - Drag to reorder → order changes
  - Delete field → removed + cascade cleans conditions
  - Add conditional rule → ⚡ badge appears on card
  - Preview → all fields render disabled
  - Save → "Saved!" toast, URL updates
  - Refresh → form reloads from localStorage

---

## Phase 6 — Fill Mode

### Task 22: FillReducer
**File:** `src/fill/FillReducer.ts`

State: `{ schema, values, touched, isSubmitted, errors, visibility, savedResponse }`

- [ ] `createInitialFillState(schema)` — calls `reg.createDefaultValue` for each field, runs engines
- [ ] `VALUE_CHANGE` → update values → run ConditionalLogicEngine + CalculationEngine → if isSubmitted: revalidate all
- [ ] `FIELD_BLUR` → mark field touched → validate that field only
- [ ] `SUBMIT_ATTEMPT` → set isSubmitted=true → validateAll visible non-section non-calc fields
- [ ] `SUBMIT_SUCCESS` → store savedResponse
- [ ] Engine pipeline: always update calculation values after visibility change
- [ ] **Verify:** `npm run build` passes

---

### Task 23: Fill Page UI
**Files:** `src/fill/FillForm.tsx` + `.module.css` · `src/pages/FillPage.tsx` + `.module.css`

**FillForm:**
- [ ] Render only fields where `visibility[field.id] !== false`
- [ ] For each field: call `reg.Renderer` with value, onChange dispatching VALUE_CHANGE, onBlur dispatching FIELD_BLUR
- [ ] Submit button at bottom → dispatches SUBMIT_ATTEMPT; if no errors → builds FormResponse + saves + dispatches SUBMIT_SUCCESS

**FillPage:**
- [ ] Load template from storage; show "not found" if missing
- [ ] Before submit: show form; after SUBMIT_SUCCESS: show success screen with "Download PDF" button
- [ ] Download PDF: `window.print()` (PrintDocument must be mounted, see Task 24)
- [ ] **Verify in browser:**
  - Fill a form with conditional rules → fields show/hide correctly
  - Calculation field updates live as number fields change
  - Submit with empty required fields → error messages appear
  - Fill everything → submit → success screen
  - Download PDF button triggers print dialog

---

## Phase 7 — PDF Export

### Task 24: PrintDocument + Print CSS
**Files:** `src/pdf/PrintDocument.tsx` · `src/pdf/print.css` (imported in `main.tsx`)

**Print CSS (`@media print`):**
- [ ] Hide `body > *`, show `.print-only` only
- [ ] Style `.print-doc` with serif font, black text

**PrintDocument:**
- [ ] Formats each visible field's value for print:
  - text → value or "—"
  - number/calculation → string or "—"
  - date → `toLocaleDateString()`
  - single_select → option id (or label if you map it)
  - multi_select → comma-joined
  - file_upload → "filename.pdf (12.3 KB), ..."
  - section_header → renders as section title (not a field row)
- [ ] Shows form title, submit timestamp, response ID in header
- [ ] Mount hidden (`className="print-only"`) in FillPage after submit + InstancesListPage for re-download

- [ ] **Verify:** Print dialog shows only form response, no app chrome

---

## Phase 8 — Remaining Pages

### Task 25: Templates List Page
**Files:** `src/pages/TemplatesListPage.tsx` + `.module.css`

- [ ] Load `getAllTemplates()` on mount
- [ ] Empty state: icon + message + "Create your first form" link
- [ ] Grid of cards: title · field count · response count · updated date
- [ ] Card actions: **Fill** (primary) · **Edit** · **Responses** (only if responseCount > 0) · **Delete** (with `confirm()`)
- [ ] Delete removes from state immediately
- [ ] **Verify:** Create form → appears in list; submit response → count increments; delete → gone

---

### Task 26: Instances List Page
**Files:** `src/pages/InstancesListPage.tsx` + `.module.css`

- [ ] Load `getTemplate()` + `getResponses()` on mount
- [ ] Banner if template was deleted (template = null but responses exist)
- [ ] Table: submitted date · response ID (truncated) · visible field count · "Download PDF" button
- [ ] Download PDF: set `printResponse` state → mount `<PrintDocument>` → `window.print()`
- [ ] **Verify:** Responses appear in table; re-download PDF works; deleted template shows banner

---

## Phase 9 — Polish + Deliverables

### Task 27: Final Polish
- [ ] Walk the full user journey end-to-end (all 9 field types, conditional logic, calculation, submit, PDF)
- [ ] Fix any visual issues
- [ ] `npm run build` → 0 errors

### Task 28: README
Required content (per spec):
- [ ] How to run (`npm install` + `npm run dev`)
- [ ] localStorage schema (keys + shape of stored objects)
- [ ] Key architectural decisions — **must explicitly explain the AND/OR choice**
- [ ] What you'd improve with more time

### Task 29: AI Usage Log
**File:** `ai-usage-log.md`
- [ ] Every significant prompt used
- [ ] What was accepted / what was changed and why
- [ ] At least one example of plausible-but-incorrect AI output that you caught and fixed

---

## End-to-End Verification Checklist

Run this before declaring done:

- [ ] Create form with all 9 field types
- [ ] Set AND conditional rule (2 conditions) — verify BOTH must be true
- [ ] Set OR conditional rule — verify EITHER triggers visibility
- [ ] Add calculation field summing 2 number fields
- [ ] Save → refresh page → form reloads correctly
- [ ] Fill form: conditional fields show/hide, calculation updates live
- [ ] Submit with empty required fields → errors shown inline
- [ ] Submit fully filled → success screen
- [ ] Download PDF → print dialog shows only form response (no app chrome)
- [ ] Templates list → response count = 1
- [ ] Instances list → row for the response → re-download PDF works
- [ ] Delete template → gone from list
- [ ] `npm run build` → 0 errors
