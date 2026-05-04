# Form Builder

A browser-based form builder with no backend. You design forms, share them, collect responses, and export PDFs — everything runs in the browser and persists to `localStorage`.

## Table of Contents

- [How to Run](#how-to-run)
- [Live Application](#live-application)
- [Project Overview](#project-overview)
  - [What it does](#what-it-does)
  - [HLD Design](#hld-design)
  - [LLD Design](#lld-design)
  - [Unspecified Decisions](#unspecified-decisions)
    - [1. Visual Layout of the application](#1-visual-layout-of-the-application)
    - [2. Multi-condition AND vs OR logic](#2-multi-condition-and-vs-or-logic)
    - [3. Default visibility when defaultVisible is not configured](#3-default-visibility-when-defaultvisible-is-not-configured)
    - [4. Hidden source fields in calculations](#4-hidden-source-fields-in-calculations)
    - [5. Form builder: minimum one field required to save](#5-form-builder-minimum-one-field-required-to-save)
    - [6. Preview: conditional logic disabled](#6-preview-conditional-logic-disabled)
    - [7. Post-submit UX: success screen](#7-post-submit-ux-success-screen)
    - [8. Cascade delete: clean up conditions referencing deleted fields](#8-cascade-delete-clean-up-conditions-referencing-deleted-fields)
    - [9. Unsaved work protection in builder](#9-unsaved-work-protection-in-builder)
    - [10. File uploads in PDF: filename + size](#10-file-uploads-in-pdf-filename--size)
  - [Tech stack and why](#tech-stack-and-why)
- [Design Patterns](#design-patterns)
  - [Component registry](#component-registry)
  - [Discriminated unions for type safety](#discriminated-unions-for-type-safety)
  - [Pure logic engines](#pure-logic-engines)
  - [useReducer for state management](#usereducer-for-state-management)
- [Deep Dive](#deep-dive)
  - [How the form builder works](#how-the-form-builder-works)
  - [How form filling and validation work](#how-form-filling-and-validation-work)
  - [How conditional logic works](#how-conditional-logic-works)
  - [How calculation fields work](#how-calculation-fields-work)
  - [Data structures at a glance](#data-structures-at-a-glance)
- [Adding a New Field Type](#adding-a-new-field-type)
- [What We Didn't Build (Future Scope)](#what-we-didnt-build-future-scope)
  - [Functional Requirements](#functional-requirements)
  - [Stretched Scope / Non Functional Requirements](#streached-scope--non-functional-requirements)

---

## How to Run

```bash
npm install
npm run dev      # development server → http://localhost:5173
npm run build    # production build
npm run preview  # preview production build
```

## Live Application

[Live Form Builder 🚀](https://form-builder-seven-gules.vercel.app/)

---

## Project Overview

### What it does

- **Build** forms with 10 field types: single-line text, multi-line text, number, date, single-select, multi-select, file upload, section header, and calculation fields.
- **Add conditional rules** — show or hide fields based on what a user has entered elsewhere in the form.
- **Fill** forms and submit responses.
- **Export** any response as a PDF via the browser's print dialog.

### HLD Design

https://excalidraw.com/#json=R6NOEkGR-pzhKJRW4ES_J,d4orvv7JYgXToweewNrEOw

### LLD Design

https://excalidraw.com/#json=wdQQ1WDZs4Qu1BXipF_44,O-h2c2ZxKlayvSOljXIf-w

### Unspecified Decisions

#### 1. Visual Layout of the application

**Spec gap:** There were no clear layout of showing the submitted templates, builder, filler and displaying saved responses.
**Decision:** Splitted the application based on route based to manage the visual display for the different section of the application

```
1. `/` --> Entry point. Shows all saved templates. Lets users create new templates or start filling existing ones.

2. `/builder/new` (new) | `/builder/:templateId` (edit) --> Manage a brand new Template or edit existing one. Used unique template Id to manage individual templates. This will help Author to share specific template explicitly.

3. `/fill/:templateId` --> For Taking user response corresponding to a specific template.

4. '/templates/:templateId/responses' --> View all submitted responses for a given template. Re-download any response as PDF

5. '*' --> for any invalid url show an user friendly error message to the user.
```

---

#### 2. Multi-condition AND vs OR logic

**Spec gap:** The spec listed operators but only said "document your AND/OR decision in the README."

**Decision:** AND is the default. OR is available via `rule.logic = 'OR'`.

**Product reasoning:** AND is the safer default. "Show shipping address when country is selected AND customer type is business" is far more common than OR. OR logic is opt-in for advanced cases. Defaulting to AND prevents form builders from accidentally showing fields when only one of several conditions is met.

---

#### 3. Default visibility when `defaultVisible` is not configured

**Spec gap:** The spec said fields have a "default visibility: visible or hidden" but didn't say what happens if a form author sets a condition without explicitly setting the default.

**Decision:** `defaultVisible ?? (effect === 'hide')` — if the effect is `show`, the field is hidden by default (revealed by condition); if the effect is `hide`, the field is visible by default (hidden by condition).

**Product reasoning:** This derives the most likely intent from the effect itself. A condition whose effect is `show` almost certainly means "this field should start hidden and appear when triggered." The inverse applies to `hide`. This makes the UI for condition setup less error-prone — the author picks an effect and the default follows naturally.

---

#### 4. Hidden source fields in calculations

**Spec gap:** The spec said calculations cannot use other calculation fields as sources, but was silent on what to do if a source Number field is hidden due to conditional logic.

**Decision:** Hidden source fields are **excluded** from the calculation. If all sources are hidden, the calculation shows `null`.

**Product reasoning:** Including a hidden field's value in a visible total would be confusing and potentially misleading. If a user fills in a salary field that's then hidden by a condition, showing that value silently accumulated in a total would be a data integrity issue. "What you see is what gets computed" is the correct mental model.

---

#### 5. Form builder: minimum one field required to save

**Spec gap:** The spec said the Save button "persists the template to localStorage" but set no minimum content requirement.

**Decision:** A form cannot be saved with zero fields. Validation requires: non-empty title + at least one field.

**Product reasoning:** An empty form template has no utility and would clutter the templates list. This guard also prevents a degenerate edge case in Fill Mode (an empty form that immediately submits). It's the form builder equivalent of "a document must have content."

---

#### 6. Preview: conditional logic disabled

**Spec gap:** The spec didn't say whether preview should run live conditional logic.

**Decision:** Conditional logic is explicitly disabled in preview mode.

**Product reasoning:** Conditional logic is value-driven — it requires user input to evaluate. In preview with no values filled, all conditions evaluate false, making all fields show in their default state. Running logic that can't actually fire is misleading. Explicitly disabling it (and noting this to the user with a banner) is more honest. Truly testing conditional logic requires filling the form, which is what Fill Mode is for.

---

#### 7. Post-submit UX: success screen

**Spec gap:** The spec said "Submit — saves the filled instance" and "Download PDF — exports the form" but didn't specify the post-submit experience or flow.

**Decision:** After successful submission, replace the form with a success screen showing a confirmation message, a "Download PDF" button, and a link back to the templates list.

**Product reasoning:** The form disappears (submit is destructive — you can't un-submit). A success screen with acknowledgment is mandatory to prevent confusion ("Did it submit? Should I click again?"). Putting the PDF download directly on the success screen reduces friction — it's the most common next action after submitting a form.

---

#### 8. Cascade delete: clean up conditions referencing deleted fields

**Spec gap:** The spec said "a field cannot set a condition on itself" but was silent on what happens when a referenced target field is deleted.

**Decision:** Three-layer cleanup on field deletion: (1) remove the field, (2) remove any conditions in other fields' rules where `targetFieldId === deletedFieldId`, (3) if a rule ends up with zero conditions, delete the entire rule.

**Product reasoning:** Orphaned conditions referencing deleted fields would cause silent runtime failures or permanent stuck states (e.g., a field whose visibility is controlled by a non-existent field would never change). The cascade cleanup keeps the schema self-consistent without requiring the builder to manually audit dependencies. This is the same design as foreign key constraints in databases.

---

#### 9. Unsaved work protection in builder

**Spec gap:** The spec didn't mention browser navigation protection.

**Decision:** A `beforeunload` event listener fires a browser "Are you sure you want to leave?" dialog when the builder has unsaved changes (`isDirty === true`).

**Product reasoning:** The builder is a stateful editor. A user who accidentally clicks the browser's back button or closes the tab loses all work in progress. This is a standard editor UX convention (Google Docs, Figma, VS Code all do this). The cost is one dialog prompt; the benefit is preventing frustrating data loss.

---

#### 10. File uploads in PDF: filename + size

**Spec gap:** The spec said "PDF export should handle the fact that file contents cannot be embedded" but didn't say what to show instead.

**Decision:** Render file upload values as `filename.pdf (42.3 KB)`, comma-separated if multiple files.

**Product reasoning:** The goal of a PDF export is a human-readable record. Showing the filename and size gives the reader enough context to identify which file was attached without embedding the actual bytes. This is the same pattern used by email clients when showing attachment metadata in a thread summary.

### Tech stack and why

| Concern          | Choice                                | Why this, not the alternative                                                                                                                                                                                        |
| ---------------- | ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| UI               | React 19                              | Mature ecosystem, concurrent rendering, hooks-first model                                                                                                                                                            |
| Language         | TypeScript                            | Discriminated unions let us model 9 field types safely — no casting, no `any`                                                                                                                                        |
| Build tool       | Vite                                  | Sub-second HMR, zero-config for TS/TSX, no Webpack manual config required                                                                                                                                            |
| Routing          | React Router v7                       | Standard client-side routing — no SSR needed, so Next.js would be overkill                                                                                                                                           |
| Drag-and-drop    | @dnd-kit                              | default `dragover` firing rate is uncontrolled — we need manual throttling, Reorder logic is not straight forward, Bugs differ across browsers, especially Firefox, Accessibility problem have to deal with manually |
| State management | `useReducer` (built-in)               | Forms are local UI state — Zustand or Redux would add overhead to maintain application state                                                                                                                         |
| Persistence      | `localStorage`                        | No backend requirement; schema is versioned for future migrations                                                                                                                                                    |
| PDF export       | Browser print dialog - window.print() | No server-side library needed; print CSS handles the layout, style a hidden <div> with @media print CSS to look like a PDF, then trigger print.                                                                      |

---

## Design Patterns

### Component registry

Every field type is registered once at startup via `registerField()` in `src/registry/register.ts`. Each registration is a contract: give us a fill renderer, a config panel, a PDF renderer, a validator, a default config, and a default value — and the rest of the app will just work.

The builder (`BuilderPage`), the filler (`FillForm`), and the PDF printer (`PrintDocument`) all look up field behavior by `kind` at runtime. They never hard-code field types.

**Tradeoff:** Adding a new field type means implementing all six parts of the contract. That's intentional friction — a half-implemented field type would silently break things. The upside is that the core pages never need to change.

### Discriminated unions for type safety

Both `FieldConfig` and `FieldValue` are discriminated unions on a `kind` field:

```ts
type FieldConfig =
  | SingleLineConfig   // kind: 'single_line'
  | MultiLineConfig    // kind: 'multi_line'
  | NumberConfig       // kind: 'number'
  | ...
```

TypeScript narrows these automatically in `switch` statements, so every field-specific operation gets compile-time exhaustiveness checks. If we add a new `kind` to the union and forget to handle it somewhere, the build fails.

### Pure logic engines

The conditional logic engine (`src/engines/conditionalLogicEngine.ts`) and the calculation engine (`src/engines/calculationEngine.ts`) are pure functions:

```
(schema, values) → { visibility, requiredOverrides }
(schema, values, visibility) → { calculationFieldId: number | null }
```

No React, no side effects, no shared state. They can be called from inside a reducer, from a test, or from anywhere. The tradeoff is they re-run on every keystroke — acceptable at this scale, but we'd add memoization for very large forms.

### `useReducer` for state management

Both builder mode and fill mode use `useReducer`. The reason: every meaningful action has side effects on _other_ parts of state.

Delete a field? You also need to remove every conditional rule that references it. Change a field's type? You need to prune any conditions that are now type-incompatible. Submit a form with errors? we need to set validation state, mark all fields as touched, and _not_ save yet.

With `useState`, these cascades scatter across event handlers in different components. With `useReducer`, every state transition lives in one file. You can read `BuilderReducer.ts` top to bottom and understand every possible thing that can happen to the builder state.

---

## Deep Dive

### How the form builder works

The builder's state is:

```ts
{
  schema: FormSchema        // the form definition being edited
  selectedFieldId: string | null
  isDirty: boolean          // unsaved changes exist
  schemaErrors: SchemaError[]
}
```

When we add a field, `FIELD_ADD` fires, the registry creates a default config for that `kind`, and it gets appended to `schema.fields`. When you edit a field's config, `FIELD_UPDATE` fires and also calls `cleanupOrphanedConditions()` — this prunes any conditional rules pointing at operators that no longer make sense for the field's new type.

When we hit Save, `validateSchema()` runs first. It checks: the form has a title, has at least one field, every field has a label, and every select field has at least one option. If validation fails, the errors go into `schemaErrors` and the save is blocked. If it passes, the schema is written to `localStorage` and `isDirty` clears.

`schemaErrors` lives in reducer state (not computed on the fly) because errors are deliberately suppressed on initial load — they only appear after you've tried to save at least once. A derived value can't hold that "have you tried yet?" flag.

### How form filling and validation work

The fill state is:

```ts
{
  schema: FormSchema;
  values: Record<fieldId, FieldValue>;
  touched: Record<fieldId, boolean>;
  isSubmitted: boolean;
  readyToSave: boolean; // true only when submit passed validation
  errors: Record<fieldId, string>;
  visibility: VisibilityState;
  requiredOverrides: Record<fieldId, boolean | null>;
  savedResponse: FormResponse | null;
}
```

Every time a value changes (`VALUE_CHANGE`), the reducer runs both engines and, if the user has already tried submitting, re-validates immediately so they get inline feedback as they fix errors.

When the user blurs a field (`FIELD_BLUR`), that single field gets validated and marked touched — errors appear progressively, not all at once on load.

When the user clicks Submit (`SUBMIT_ATTEMPT`), all visible fields are validated. If zero errors, `readyToSave` is set to `true`. `FillPage.tsx` watches `readyToSave` (not `isSubmitted`) to trigger the save and redirect. This distinction matters: if the page watched `isSubmitted + no errors`, fixing a validation error would auto-submit the form without the user clicking Submit again — that's a bug we fixed explicitly.

Hidden fields are never validated and never included in the saved response.

### How conditional logic works

Every field can optionally have a `ConditionalRule`. When the engine runs, it does this for each ruled field:

1. Evaluate each `Condition` — 14 operators covering text equality, text containment, numeric comparisons, date before/after, range checks, select inclusion, and fill/empty checks.
2. Combine results with `rule.logic`: `AND` (all must pass) or `OR` (any must pass).
3. Apply `rule.effect`:
   - `show` / `hide` — controls whether the field is visible. `defaultVisible` sets the baseline before conditions apply.
   - `mark_required` / `mark_not_required` — doesn't touch visibility; overrides the field's `required` flag dynamically.

Fields with no rule are always visible.

`AND` is the default logic, not `OR`. The reason: if a sensitive field has multiple guards ("show only if role is admin AND department is finance"), `OR` would accidentally expose it when just one guard passes. The safer default is `AND`.

The engine evaluates in a single pass — no cycle detection. Circular rules (field A appears when B is filled, B appears when A is filled) produce stable but potentially surprising results. Cycle detection would require graph traversal on every keystroke, which isn't worth it here.

### How calculation fields work

A calculation field declares a list of source field IDs and an operation (sum, average, min, max). The engine:

1. Filters sources to only those that are currently visible (hidden values shouldn't leak into outputs).
2. Rejects other calculation fields as sources — this blocks circular chains without needing graph traversal.
3. Applies the operation and rounds to `decimalPlaces`.
4. Returns `null` if no valid sources exist.

### Data structures at a glance

```
FormSchema.fields                       → FieldConfig[]        (ordered array — order = render order)
FormSchema.conditionalRules             → Record<fieldId, ConditionalRule>   (O(1) lookup)
FillState.values                        → Record<fieldId, FieldValue>
FormResponse.schemaSnapshot             → FormSchema           (full snapshot at submit time)
FormResponse.visibleFieldIds            → string[]             (snapshot of visibility at submit)
FormResponse.fieldLabelSnapshot         → Record<fieldId, string>
```

The response captures a full snapshot of the schema at submission time. This means PDFs regenerated months later still show the correct labels, options, and field order — even if the template has been edited or deleted since.

---

## Adding a New Field Type

Here's exactly what you need to do — no other files require changes.

**1. Add the kind to the type union** (`src/types/index.ts`)

```ts
type FieldKind = 'single_line' | ... | 'my_field'
```

**2. Define the config and value types** (`src/types/index.ts`)

```ts
interface MyFieldConfig extends FieldConfigBase {
  kind: "my_field";
  // ...your config options
}

type MyFieldValue = { kind: "my_field"; value: string };
```

Add both to the `FieldConfig` and `FieldValue` discriminated unions.

**3. Create the field file** (`src/fields/MyField.tsx`)

Implement six things:

- `FillRenderer` — the React component the user interacts with
- `ConfigPanel` — the config options shown in the builder sidebar
- `PrintRenderer` — how the field looks in the PDF
- `validate(config, value) → string | null` — returns an error string or null
- `defaultConfig(id) → MyFieldConfig` — the initial config when the field is added
- `defaultValue() → MyFieldValue` — the initial value when the form loads

**4. Register it** (`src/registry/register.ts`)

```ts
registerField("my_field", {
  fillRenderer: MyFillRenderer,
  configPanel: MyConfigPanel,
  printRenderer: MyPrintRenderer,
  validate,
  defaultConfig,
  defaultValue,
});
```

Done. The builder palette, form filler, and PDF printer will all pick it up automatically.

---

## What We Didn't Build (Future Scope)

These are real gaps — things that would matter in a production product but were out of scope here.

### Functional Requirements:

**Cyclic Detection** - I did not cover cyclic detection in conditional logic. Let's consider the scenrio Like A's visiblity depends on B's value and B's visibility depends on A's value. In this case in filler mode both the fields woould be hidden.

**Custom validation** — Field configs support built-in constraints (min/max length, date bounds, selection counts). There's no way for a form author to add a regex pattern or write a custom error message. This would require extending `FieldConfigBase` with a `validationRules` array and updating the validator in each field.

**Multi-step / wizard forms** — Everything renders on one page. A multi-page form with Next/Back navigation and per-page validation would need a page grouping concept in `FormSchema` and a current-page index in `FillState`.

**Collapsible sections** — `SectionHeaderField` is a visual divider, not a container. Grouping fields under a collapsible section would require a parent-child relationship in the schema that doesn't exist now.

**Embeddable widget** — The form can't be dropped into a third-party page. Supporting an embed scenario (like Typeform or Zoho) would need an `<iframe>` host mode, a `postMessage` API for communicating responses back to the parent page, and CORS-safe storage.

### Streached Scope / Non Functional Requirements:

**Access control (RBAC)** — There's no authentication layer. Any user who opens the app can create, edit, or delete any form. A proper multi-user system would need at minimum Admin and Viewer roles, per-form permissions, and a real backend.

**Custom theming** — Colors, fonts, and spacing are hardcoded in CSS modules. A themeable form builder would expose a design token layer and let form authors set brand colors, font choices, and border radius from the UI.

**Accessibility Support** - Due to time constraints, the application is not fully compliant with WCAG standards. This can be improved by implementing proper focus management, including focus trapping and ensuring seamless keyboard navigation throughout the application.

**Testing** — There's no Playwright or Cypress suite or unit test suite. Correctness is covered by TypeScript's type system and manual testing. A test suite covering the conditional logic engine edge cases and the full submit/validate/PDF flow would be the highest-value testing addition.
