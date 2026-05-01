# Form Builder

A browser-based form builder built with React 19 + TypeScript. Create forms with conditional logic, fill them out, and export responses as PDFs — all without a backend.

## How to Run

```bash
npm install
npm run dev      # development server → http://localhost:5173
npm run build    # production build
npm run preview  # preview production build
```

## localStorage Schema

All data is stored client-side under these keys:

| Key | Type | Shape |
|-----|------|-------|
| `fb:version` | integer | Schema version number (used for future migrations) |
| `fb:templates` | JSON object | `Record<templateId, StoredTemplate>` |
| `fb:responses:{templateId}` | JSON object | `Record<responseId, FormResponse>` — one key per template |

### StoredTemplate

```ts
{
  schema: FormSchema        // the full form definition
  responseCount: number     // denormalized count for the templates list
}
```

### FormSchema

```ts
{
  id: string
  title: string
  description: string
  fields: FieldConfig[]                          // ordered list of all fields
  conditionalRules: Record<fieldId, ConditionalRule>
  createdAt: string  // ISO timestamp
  updatedAt: string  // ISO timestamp
}
```

### FormResponse

```ts
{
  id: string
  templateId: string
  schemaSnapshot: FormSchema    // full schema at time of submission
  values: Record<fieldId, FieldValue>
  visibleFieldIds: string[]     // snapshot of which fields were visible on submit
  fieldLabelSnapshot: Record<fieldId, string>  // label text at time of submission
  submittedAt: string           // ISO timestamp
}
```

## Architectural Decisions

### AND is the default for conditional logic (not OR)

When a form field has a conditional rule with multiple conditions, `AND` is the default — all conditions must be true for the field to appear. This is the safer default: it prevents accidentally showing a sensitive field when only one of several guards is satisfied. OR behavior (show when _any_ condition matches) is available via a toggle that appears once ≥2 conditions exist.

### Component registry pattern

All 9 field types (single-line text, multi-line text, number, date, single-select, multi-select, file upload, section header, calculation) are registered in a central `Map` at startup via `registerField()`. Builder and fill mode look up fields by kind at runtime — adding a new field type requires no changes to `BuilderPage`, `FillForm`, or `PrintDocument`.

### Pure engine functions

The conditional logic engine and calculation engine are pure functions with no side effects: `(schema, values) → visibility` and `(schema, values, visibility) → calculations`. This makes them trivially testable and easy to call from both the builder preview and fill mode reducer without any shared state.

### `useReducer` over external state management

Both builder and fill mode use `useReducer` with co-located reducer files. The form schemas are small enough that Zustand or Redux would add more ceremony than value. The reducers handle cascade cleanup (e.g. removing conditions that target a deleted field) centrally so no component needs to manage side effects in siblings.

### Schema and label snapshots on FormResponse

`schemaSnapshot`, `visibleFieldIds`, and `fieldLabelSnapshot` are all captured at submission time. This ensures PDFs are stable even if the template is later edited or deleted — the response always contains everything needed to render the PDF without re-fetching the template.

### Number input uses `type="text"` with `inputMode="decimal"`

`<input type="number">` has browser quirks: it changes value on scroll, accepts the character "e", and has locale-dependent decimal separators. Using `type="text"` with `inputMode="decimal"` avoids these while still triggering the numeric keyboard on mobile.

### SingleSelect uses one component for three display modes

Radio buttons, dropdown, and tile-style display are handled by a single `SingleSelectField` component with an internal `switch` on `displayType`. Three separate registrations would share no code and validation logic would diverge silently over time.

### Calculation fields exclude hidden sources and other calculations

A calculation field only reads from _visible_ source fields. Hidden field values must not leak into form outputs. Chaining calculations (calc A referencing calc B) is also blocked to avoid circular dependency issues without requiring graph traversal.

### `minSelections` vs `maxSelections` timing

`maxSelections` is enforced as a hard cap during interaction (unchecked options become disabled when the limit is reached). `minSelections` is a completion requirement checked only on submit — it would be disruptive to show an error while the user is still selecting.

### Error display gating: `isTouched || isSubmitted`

Errors are not shown on mount. A field only shows its error after the user has interacted with it (blur) or attempted to submit the form. This avoids the poor UX of showing a wall of errors before the user has typed anything.

### Submit and Download PDF are separate actions

Submission saves the response to localStorage. Downloading the PDF is an independent button on the success screen. Auto-triggering the print dialog on submission would be surprising and would prevent the user from reviewing the success screen first.

### Circular conditional rules are not detected

The conditional logic engine evaluates one pass per render cycle. Circular rules (Field A shows when Field B is filled; Field B shows when Field A is filled) produce stable but potentially surprising behavior — both fields settle at whatever state they had on the previous cycle. Cycle detection would require graph traversal on every keystroke, which is not worth the complexity at this scope.

## What I'd Improve With More Time

- **End-to-end tests** — Playwright suite covering the full conditional logic engine and calculation field edge cases
- **Keyboard-only drag-and-drop** — up/down arrow buttons as an accessible fallback in the builder canvas
- **Form versioning** — show which schema version a response was submitted against; warn when re-downloading a PDF for a response whose template has since changed
- **Duplicate form action** — clone a template from the templates list
- **CSV export** — download all responses for a template as a spreadsheet
- **Rich text in section headers** — bold, italic, links in section descriptions
- **Field dependency graph visualization** — show which fields control visibility of other fields
