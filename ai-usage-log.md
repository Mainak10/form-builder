# AI Usage Log

> This document covers every significant AI-assisted decision during the
> development of this Form Builder assignment.
>
> ---
>
> **Tools used:**
>
> - **Claude Code** — primary assistant for architecture, component
>   design, and logic implementation
> - **claude-mem plugin** — used to persist project context (field types, schema
>   decisions, registry contract) across sessions. Without this, I'd have been
>   re-pasting the full spec at the start of every conversation. It kept prompts
>   lean and let me focus each session on one concern at a time.
> - **Claude Frontend Design Plugin** — used to generate the base CSS variable
>   system (`index.css`), `FieldWrapper` shell, and three-panel builder layout.
>   This wasn't about aesthetics — it gave me a consistent token system
>   (`--accent`, `--border`, `--radius`, etc.) from day one so I wasn't making
>   ad-hoc color decisions across 30+ component files.
> - **Superpower for Claude** — used during two brainstorming sessions (registry
>   design, conditional logic engine design) to run branching conversations and
>   compare two approaches side-by-side before committing to one. This is where
>   the weak-typing flaw in the registry got caught before it shipped.

---

## Prompt 1 — Architecture Brainstorm Before Writing a Single File

### Context

Before touching the keyboard, I spent time with Claude working through the
overall structure, Plan to iteractively develop the application. I didn't want to start coding and discover halfway through
that my lld might need to change.

### What I asked

> "I'm building a browser-based form builder for a take-home assignment. It has
> two modes: Builder (design a template) and Fill (submit a response). There are
> 10 field types. Some fields have conditional visibility rules driven by other
> fields' values. There's also a Calculation field that derives its value from
> Number fields in real-time.
>
> What are the top 3–4 architectural risks in this kind of app, and for each one,
> what's the decision I need to make upfront to avoid it becoming a problem later?"

### What the AI produced

Four risks with concrete framing:

1. **Stale response data** — if the template schema is mutable after responses
   are submitted, re-downloading an old PDF could show wrong field labels or
   missing fields. Fix: snapshot the full schema inside each `FormResponse` at
   submit time.

2. **Conditional logic evaluation order** — if Field D has a condition on Field
   C, and Field C is itself hidden by another condition, which value does D use?
   Fix: evaluate fields in **schema's field order** using already-computed visibility, not
   raw values.

3. **"Adding a new field type touches 6 files"** — without a registry pattern,
   every new field type means editing the Builder render switch, the Fill render
   switch, the ConfigPanel switch, the validation switch, etc. Fix: a component
   registry where each field self-registers its Renderer, Editor, validator, and
   defaults.

4. **localStorage write amplification** — if responses are stored inside the
   template object, every new submission rewrites the entire template. For a
   template with 100 responses, that's a large serialization cost and a larger
   corruption risk. Fix: separate `fb:responses:{templateId}` keys.

### What I used

All four risks became the foundational decisions of the architecture. Risk 1
drove the `schemaSnapshot` field in `FormResponse`. Risk 2 drove the serial
evaluation order in `conditionalLogicEngine.ts`. Risk 3 drove the entire
registry pattern. Risk 4 drove the `fb:responses:{id}` key separation.

### What I changed / my own additions

The AI didn't surface one risk I'd thought of independently: **the cascade
cleanup problem**. When a field is deleted, any other field that has a
conditional rule targeting the deleted field's ID now holds a dangling
`targetFieldId`. I flagged this upfront and made cascade cleanup a first-class
concern in `BuilderReducer.ts` via `cleanupOrphanedConditions`, rather than
something I'd have to retrofit later.

---

## Prompt 2 — localStorage Schema Design

### What I asked

> "Design a normalized localStorage schema for this form builder. Constraints:
>
> - No backend. Everything in localStorage.
> - Templates are editable after creation.
> - Each template can have many submitted responses.
> - Re-downloading an old response as PDF must always reflect what the user
>   _actually saw_ when they submitted — not the current template state.
> - Adding a new field type must not require a schema migration.
> - Deleting a template should cleanly remove its responses without touching
>   other templates' data.
>
> Show me the localStorage keys, the TypeScript types, and the reasoning behind
> each decision."

### What the AI produced

Three top-level keys:

```
fb:version          → integer (migration guard)
fb:templates        → Record<templateId, StoredTemplate>
fb:responses:{id}   → Record<responseId, FormResponse>  (one key per template)
```

And the `schemaSnapshot` pattern — embed the full `FormSchema` inside each
`FormResponse`. The reasoning: once a response is submitted, the schema it was
filled against becomes immutable from that response's perspective. The live
template can change, but the PDF export always reads from
`response.schemaSnapshot`, not from the current template.

### What I verified

- Traced through: user submits response → builder edits the template (renames
  a field, deletes a field) → user clicks "Re-download PDF" on the old response.
  Confirmed `schemaSnapshot` ensures the re-download is always correct.
- Checked realistic storage usage: 15 fields, 50 responses ≈ 180–220KB. Well
  inside the 5MB localStorage limit.
- Verified that `localStorage.removeItem(fb:responses:${id})` on template
  deletion is surgical — it doesn't touch any other template's response data.

### Where the AI was plausible but incorrect

The AI initially put `responses: FormResponse[]` as an array directly inside
`StoredTemplate`. This looks reasonable — responses belong to a template, so
why not co-locate them?

The problem is subtle: to append one new response, you'd have to deserialize the
entire template object, push to the array, re-serialize the whole thing, and
write it back. If the write fails mid-way due to a quota error, the entire
template entry — including the schema — could be corrupted.

By separating responses into their own key per template, each response write is
isolated. A quota failure on `fb:responses:{id}` never touches `fb:templates`.

I caught this not because the AI's suggestion was obviously wrong, but because
I specifically asked myself: "what's the worst-case failure mode of this write
pattern?"

---

## Prompt 3 — TypeScript Discriminated Union for Field Types

### What I asked

> "Write the complete TypeScript discriminated union for all 9 field types:
> single_line, multi_line, number, date, single_select, multi_select,
> file_upload, section_header, calculation.
>
> Requirements:
>
> - A shared `FieldConfigBase` with `id`, `kind`, `label`, `required`, `hint`
> - Each type extends the base with its own config properties
> - `SectionHeader` should NOT have `required` — it captures no value
> - `Calculation` should have `sourceFieldIds: string[]`, `operation`, and
>   `decimalPlaces`
> - `SingleSelect` needs `displayType: 'radio' | 'dropdown' | 'tiles'` No `any`
> - Accessing `config.options` on a `NumberConfig` must be a compile
>   error without narrowing."

### What the AI produced

A solid discriminated union. The `kind` discriminant on each interface, the
`FieldConfig` union type, and the `FieldValue` mirror union (so values are typed
to match their config) were all correct.

### Where the AI was plausible but incorrect

`SectionHeaderConfig` was generated with `required: boolean` inherited from
`FieldConfigBase` — even though I explicitly said it shouldn't have `required`.

This compiles and runs without any error. But it's a design lie: the type says
this field can be required, when it never should be. The ConfigPanel would have
rendered a "Required" toggle on section headers, which makes no product sense.

Fix: I had `SectionHeaderConfig` extend a separate `DisplayFieldBase` that omits
`required` entirely:

```typescript
interface DisplayFieldBase {
  id: string;
  kind: FieldKind;
  label: string;
  // no `required` — display elements capture no value
}

export interface SectionHeaderConfig extends DisplayFieldBase {
  kind: "section_header";
  size: "XS" | "Small" | "Medium" | "Large" | "XL";
  description?: string;
}
```

TypeScript now correctly refuses to compile any code that reads
`sectionHeaderField.required` without a type guard.

Also: `CalculationConfig` was generated with `operation: 'sum' | 'average' | 'product'`
but the spec says **Sum, Average, Minimum, Maximum** — not product. The AI had
included "product" as a sensible aggregation (it is mathematically), but it
wasn't in the spec. I added `'min' | 'max'` and removed `'product'`.

---

## Prompt 4 — Component Registry Pattern

### What I asked

> "I have 10 field types. I need an architecture where adding a 10th field type
> requires only: (1) creating one file in `src/fields/`, (2) adding one import
> line to `src/registry/register.ts`. Zero changes to Builder, Fill, ConfigPanel,
> or any other existing file.
>
> Each field registration must export: `Renderer`, `Editor`,
> `validate(config, value, isRequired) → string | null`,
> `createDefaultConfig(id)`, `createDefaultValue(config)`, `paletteLabel`,
> `icon`.
>
> The registry must be generic: each field's Renderer must receive its own
> narrowed config type — NumberField's Renderer gets `NumberConfig`, not the
> wide `FieldConfig` union."

### What the AI produced (first attempt — via Superpower side-by-side)

```typescript
// Option A — what Claude initially suggested
const registry = new Map<
  FieldKind,
  FieldRegistration<FieldConfig, FieldValue>
>();
```

### Where the AI was plausible but incorrect

This compiles. It runs. But it defeats the entire purpose of the registry.

Storing everything as `FieldRegistration<FieldConfig, FieldValue>` means when
you retrieve a `NumberField` registration, `props.config` inside its Renderer
is typed as the wide `FieldConfig` union. You'd need `as NumberConfig` casts
inside every field component. The registry provides zero narrowing.

I caught this using Superpower's side-by-side comparison — I had two registry
designs open simultaneously and saw that Option A required `as any` in 9
different Renderer functions, while Option B (generic registration + narrow cast
at registration time) isolated the cast to one line in the registry itself.

The fix: each field registers with its own concrete generic pair. The cast is
isolated to `registerField`:

```typescript
export function registerField<C extends FieldConfig, V extends FieldValue>(
  reg: FieldRegistration<C, V>,
): void {
  // Cast happens exactly once — here, in the registry itself
  registry.set(reg.kind, reg as FieldRegistration);
}
```

Every field component file is now type-safe with zero casts. The
`// eslint-disable` comment in `validateField` is the only exception, and it's
clearly documented.

### What I verified

- Added a hypothetical `SignaturePad` field type mentally. Touched exactly 2
  files: new `SignaturePadField.tsx` + one import in `register.ts`. Zero other
  files changed.
- Confirmed `NumberField`'s Renderer had `config: NumberConfig`. Accessing
  `config.options` in `NumberField.tsx` correctly produced a TS error.

---

## Prompt 5 — Number Field: `type="text"` vs `type="number"` Decision

### Context

This came up mid-implementation when writing `NumberField.tsx`. The spec says
"a numeric input" — which sounds obvious. But `type="number"` has well-known
UX problems. I used Claude to pressure-test my instinct before committing.

### What I asked

> "For a Number field in a SaaS form builder, should I use `<input type='number'>`
> or `<input type='text' inputMode='decimal'>`? The field has configurable
> `decimalPlaces` (0–4) and optional `min`/`max` values."

### What the AI produced

A clear recommendation for `type="text"` with `inputMode="decimal"`:

- `type="number"` fires `onChange` on scroll when focused — a known foot-gun
- `type="number"` rejects characters mid-typing (e.g. `-` before the rest of
  the number), causing jarring UX
- Browser spinner controls are hard to suppress cross-browser
- `type="text"` + parse-on-blur gives full control: show raw string while
  typing, parse and round to `decimalPlaces` on blur, push `null | number` only
  when the user is done

### What I used

Adopted fully. `NumberField.tsx` uses `useState` to track the raw input string
separately from the committed numeric value. On blur: parse → round to
`config.decimalPlaces` → call `onChange`.

### One thing I added beyond the AI's suggestion

The blur handler didn't handle `config.min` / `config.max` validation. It just
stored whatever parsed number came out. I added range validation:

```typescript
if (config.min != null && rounded < config.min) {
  return `Minimum value is ${config.min}`;
}
if (config.max != null && rounded > config.max) {
  return `Maximum value is ${config.max}`;
}
```

---

## Prompt 6 — Conditional Logic Engine Edge Cases

### What I asked

> "Write a pure TypeScript function:
> `evaluateVisibility(schema, values): VisibilityState`
>
> Rules:
>
> 1. Fields with no ConditionalRule default to visible.
> 2. Each ConditionalRule has `logic: 'AND' | 'OR'`.
> 3. A hidden field must never contribute its value as a condition target — if
>    Field C is hidden, Field D's condition on Field C treats C as absent.
> 4. Evaluation must be serial (schema field order) so earlier visibility
>    decisions are available when evaluating later fields.
> 5. A field cannot be its own condition target.
> 6. Pure function — no side effects, no React, no DOM."

### What the AI produced

A clean pure function with correct AND/OR branching and operator implementations
for all field kinds (string, number, date, single_select, multi_select).

### What I caught

The AI's `evaluateCondition` checked `values[condition.targetFieldId]` directly.
This is almost right — but a hidden field's value may still be in the `values`
map from a previous interaction. The AI's version would let a hidden field's
stale value trigger a downstream condition.

Fix: thread the already-computed `visibilityState` into each condition
evaluation and short-circuit if the target is hidden:

```typescript
function evaluateCondition(
  condition: Condition,
  values: Record<string, FieldValue>,
  visibilityState: VisibilityState, // ← my addition
): boolean {
  if (visibilityState[condition.targetFieldId] === false) return false;
  // ... rest of operators
}
```

---

## Prompt 7 — BuilderReducer: Cascade Cleanup on Field Delete and Kind Change

### What I asked

> "Write a `useReducer` state machine for Builder Mode.
> State: `{ schema, selectedFieldId, isDirty, schemaErrors }`
>
> Actions: FIELD_ADD, FIELD_UPDATE, FIELD_DELETE, FIELD_REORDER, FIELD_SELECT,
> FORM_UPDATE, RULE_UPDATE, RULE_DELETE, SAVE_SUCCESS, LOAD_SCHEMA.
>
> FIELD_DELETE must cascade: remove the deleted field's own rule AND any other
> field's conditions that target the deleted field's ID. If removing those
> conditions empties a rule, remove the rule entirely."

### What the AI produced

A clean reducer with all 10 actions and correct cascade cleanup on `FIELD_DELETE`.

### What I added beyond the AI's output

The `FIELD_UPDATE` case only updated the field config. It didn't handle the case
where a field's **kind changes** in the builder (e.g., a `single_select` becomes
a `number` field). The field retains its ID but its kind changes.

Problem: if Field A had a conditional rule targeting Field B with
`operator: 'includes_option'` (a single_select operator), and Field B's kind
changes to `number` — that operator is now invalid. It silently returns `false`
forever because the operator doesn't match the new field type.

Fix: reuse `cleanupOrphanedConditions` in `FIELD_UPDATE` when the kind changes:

```typescript
case 'FIELD_UPDATE': {
  const oldConfig = state.schema.fields.find(f => f.id === action.config.id)
  let schema = {
    ...state.schema,
    fields: state.schema.fields.map(f => f.id === action.config.id ? action.config : f),
    updatedAt: new Date().toISOString(),
  }
  // If kind changed, cascade-clean conditions referencing this field
  // as a target — they may use operators invalid for the new kind
  if (oldConfig && oldConfig.kind !== action.config.kind) {
    schema = cleanupOrphanedConditions(schema, action.config.id)
  }
  return { ...state, schema, isDirty: true, schemaErrors: validateSchema(schema) }
}
```

---

## Prompt 8 — SingleSelect Field: Three Display Types in One Component

### What I asked

> "The SingleSelect field must render in three display modes: Radio, Dropdown,
> and Tiles. The selected value must always be the option's `id` — not its
> label. The `displayType` is set in config, not changeable by the user in fill
> mode. Write the Renderer handling all three modes."

### What the AI produced

A clean component with a switch on `displayType`. Radio and Dropdown were
correct. Tiles was mostly correct.

### Where the AI was plausible but incorrect

For Tiles mode, the AI stored the option **label** as the selected value:

```typescript
// AI generated — wrong
onChange({ kind: "single_select", value: option.label });
```

But the type contract is `value: string` where the string is the option's
**id**. This matters because conditional logic conditions are authored using
option IDs — the `ConditionalLogicEditor` populates the condition value dropdown
with `option.id` values. A value stored as a label would never match.

The Radio and Dropdown branches correctly used `option.id`. Only Tiles used
`option.label`. This is the kind of bug that passes visual inspection — Tiles
appeared to work because the display renders the label anyway — but breaks
conditional logic silently.

Fix: one-line change in the Tiles onClick:

```typescript
onChange({ kind: "single_select", value: option.id }); // was option.label
```

I caught this by reading the conditional logic evaluator's `equals` operator
alongside the Tiles renderer and noticing the value comparison was
`sel === cmp` where `cmp` came from `condition.value` (an option ID).

---

## Prompt 9 — PDF Export via window.print()

### What I asked

> "Write `triggerPDFExport(response: FormResponse)` that:
>
> - Builds an HTML string: title, timestamp, each visible field (label + value)
>   in schema order
> - Skips fields not in `response.visibleFieldIds`
> - Renders file upload fields as readable text, not raw JSON
> - calls `window.print()`
> - Add minimal custom CSS styles for the pdf
> - No third-party libraries"

### What the AI produced

A functional pdf export with correct HTML structure and print CSS.

### What I changed

**Style injection:** The AI inlined styles on every HTML element as string
concatenation. Replaced with a single `<style>` block for maintainability.

**File upload rendering:** The AI left values as raw JSON:

```
[{"name":"contract.pdf","size":204800,"type":"application/pdf"}]
```

Replaced with:

```
contract.pdf (200 KB)
```

The spec explicitly notes files can't be embedded — showing raw JSON is not
"handling" that gracefully.

**Calculation field rendering:** Added the operation label below the value:

```
Total Cost
1,250.00
(Sum of: Unit Price, Quantity)
```

### What I verified

- Confirmed the hidden field was absent from the HTML string — not just visually hidden via CSS.

---

## Prompt 10 — FillReducer: Calculation Field Real-Time Updates

### What I asked

> "Write the FillReducer. State:
> `{ values, visibility, touched, isSubmitted }`
>
> On every VALUE_CHANGE: update the value → re-run `evaluateVisibility` →
> re-run `evaluateCalculations(schema, values, visibility)` → return all three
> updated atomically.
>
> Calculation fields whose source fields are all hidden should return `null`."

### What the AI produced

A clean reducer with the correct value → visibility → calculations pipeline.

### Where the AI was plausible but incorrect

The calculation engine included hidden source fields in the calculation:

```typescript
// AI generated — wrong
const sourceValues = config.sourceFieldIds
  .map((id) => {
    const v = values[id];
    return v?.kind === "number" ? v.value : null;
  })
  .filter((v): v is number => v !== null);
```

It read from `values` directly, ignoring whether each source field was visible.
So if Field A (Number) is hidden by a condition, a Calculation summing A + B
would still include A's value even though the user can't see or interact with A.

Fix:

```typescript
const sourceValues = config.sourceFieldIds
  .filter((id) => visibility[id] !== false) // ← my addition
  .map((id) => {
    const v = values[id];
    return v?.kind === "number" ? v.value : null;
  })
  .filter((v): v is number => v !== null);
```

I caught this by testing a form where a Number field is conditionally hidden and
a Calculation sums it with another field. Toggling the condition should change
the sum — with the AI's code, it didn't.

---

## Prompt 11 — Styling: Layout Skeleton via Frontend Design Plugin

### Context

Used the **Claude Frontend Design Plugin** for the initial CSS variable system
and three-panel builder layout. This wasn't about aesthetics — it was about
getting a consistent token foundation from day one so 30+ CSS Module files
would feel coherent without ad-hoc color decisions per component.

### What I asked (via the plugin)

> "Generate a CSS variable system and three-panel builder layout for a SaaS
> form builder. Left panel: field palette (200px). Center: scrollable canvas.
> Right panel: config panel (380px). Header bar with title input and action
> buttons. CSS Modules only. Neutral, not Material/Tailwind/Bootstrap."

### What the plugin produced

The full `index.css` token system, `BuilderPage.module.css` three-panel layout,
and `FieldWrapper.module.css` shell — clean and consistent.

### What I adjusted

- Added `--mono` for monospace font — used in Instances List for response IDs.
- Added `--accent-bg: rgba(99, 102, 241, 0.08)` — needed for selected field
  highlight in `BuilderCanvas`.
- Wrote `print.css` manually — the plugin doesn't generate print stylesheets.
- Widened ConfigPanel from 260px to 380px — the ConditionalLogicEditor's
  condition row controls needed the extra space after live testing.

---
