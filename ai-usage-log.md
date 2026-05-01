# AI Usage Log

This document records significant AI prompts used during development of the form builder, what was accepted, what was changed, and at least one example of plausible-but-incorrect AI output that required correction.

---

## Prompt 1 — Project architecture and planning

**Prompt:** Described the full spec (9 field types, conditional logic with AND/OR, calculation engine, builder + fill mode, localStorage persistence, PDF export via `window.print()`) and asked for a detailed implementation plan with phases, tasks, and exact file paths.

**What was accepted:** The overall phased structure — Foundation → Shared UI → Field Implementations → Logic Engines → Builder Mode → Fill Mode → PDF Export → Remaining Pages → Polish. The plan correctly identified that the conditional logic engine and calculation engine should be pure functions, and that the component registry pattern was the right abstraction for plugging in field types.

**What was changed:** The initial plan proposed a more complex state management approach using Zustand. This was simplified to `useReducer` co-located with each mode (builder vs. fill), since the schemas are small and Zustand would have added more ceremony than value.

---

## Prompt 2 — TypeScript type contracts

**Prompt:** Asked AI to generate the full TypeScript type system: `FieldKind`, `FieldConfig` discriminated union, `FieldValue` discriminated union, `FormSchema`, `FormResponse`, `StoredTemplate`, `VisibilityState`, `Condition`, `ConditionalRule`.

**What was accepted:** The discriminated union pattern using `kind` as the discriminant. The `schemaSnapshot`, `visibleFieldIds`, and `fieldLabelSnapshot` fields on `FormResponse` — these were proposed by the AI as a way to make PDFs stable even after template edits, which was correct reasoning.

**What was changed:** The initial `FieldConfig` used a generic `options?: SelectOption[]` on the base interface. This was changed to a proper discriminated union so that TypeScript can narrow `config.options` only when `config.kind` is `single_select` or `multi_select`, avoiding runtime type guards throughout the codebase.

---

## Prompt 3 — Conditional logic engine

**Prompt:** Asked AI to implement `runConditionalLogicEngine(schema, values) → VisibilityState` with the full operator matrix (is_filled, is_empty, equals, not_equals, contains, not_contains, greater_than, less_than, before, after, includes_option, excludes_option) applied per field kind.

**What was accepted:** The pure function structure and the operator dispatch approach. The AND/OR logic via `logicOperator` on the rule.

**What was changed:** The initial implementation evaluated conditions against `values[conditionTarget]?.value` directly, which works for primitive types but broke for `multi_select` fields (where `value` is an array). The fix required type-narrowing per `FieldValue.kind` before applying operators. This was caught because the `includes_option` operator was always returning `false` for multi-select targets in manual testing.

---

## Prompt 4 — Calculation engine

**Prompt:** Asked AI to implement `runCalculationEngine(schema, values, visibility) → Record<string, number | null>` supporting sum, average, min, and max operations.

**What was accepted:** The structure, the hidden-source exclusion, and the no-chaining constraint.

**What was changed — example of plausible-but-incorrect AI output:** The AI generated an operation switch with cases `'sum'`, `'average'`, and `'product'` — completely omitting `'min'` and `'max'` and replacing them with `'product'` (which was not in the spec). Simultaneously, the `CalculationField` editor rendered a `<select>` with options `Sum`, `Average`, and `Product` (min/max absent). The code compiled without errors and looked correct at a glance because `product` is a legitimate mathematical operation. The bug was caught only when comparing the editor's option list against the spec, which required `minimum` and `maximum`. Both the engine and the editor were corrected to use `'min'` and `'max'` as the operation values.

---

## Prompt 5 — BuilderReducer cascade cleanup

**Prompt:** Asked AI to implement the `FIELD_DELETE` and `FIELD_UPDATE` actions with cascade cleanup — removing conditions that target a deleted field, and resetting conditions whose operator is no longer valid after a field kind change.

**What was accepted:** The approach of running cleanup as a utility function called from within the reducer, keeping editors unaware of sibling side effects.

**What was changed:** The initial cascade cleanup on kind-change only removed conditions where the _target_ field changed kind. It did not reset conditions on _other_ fields that targeted the changed field with a now-invalid operator (e.g., a `contains` operator targeting a field that changed from `single_line` to `number`). A second pass was added to also scrub those cross-field references.

---

## Prompt 6 — PDF export (PrintDocument + print.css)

**Prompt:** Asked AI to implement the `PrintDocument` component and `print.css`, following the spec pattern of using `window.print()` with `@media print` to hide all UI chrome and show only a `.print-only` container mounted via `createPortal`.

**What was accepted:** The `@media print` approach and the `createPortal(…, document.body)` mounting strategy to ensure the print target is a direct child of `<body>` and not clipped by any parent's overflow or transform.

**What was changed:** The initial `print.css` was missing the rule ``.print-only { display: none; }`` _outside_ the `@media print` block. Without it, the hidden print container was visible in the browser during normal use. Additionally, the first version of `formatValue` in `PrintDocument` only took `(value: FieldValue)` and printed raw option IDs (e.g., `"opt1"`) for single-select and multi-select fields instead of their human-readable labels. The signature was updated to `(value: FieldValue, field: FieldConfig)` to enable label lookup from `field.options`.

---

## Prompt 7 — FillPage submission side effect

**Prompt:** Asked AI to implement `FillPage` with the submission flow: `SUBMIT_ATTEMPT` → validate → if no errors, save to storage and dispatch `SUBMIT_SUCCESS`.

**What was accepted:** The overall state machine using `useReducer` + `FillReducer`.

**What was changed:** The AI placed the response-saving logic as a conditional inside the render function body (`if (state.isSubmitted && !hasErrors) { saveResponse(...) }`). This is a side effect during render — incorrect in React and especially problematic with `StrictMode` enabled (which renders components twice in development, causing the response to be saved twice). The fix moved the save logic into a `useEffect` with a `useRef` guard to ensure it runs exactly once per submission.
