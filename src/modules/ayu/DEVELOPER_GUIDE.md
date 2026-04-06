# Ayu Module — Developer Guide

> A multi-section clinical visit questionnaire system built on FHIR Questionnaire resources.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Directory Structure](#directory-structure)
3. [Visit Flow — 4 Sections](#visit-flow--4-sections)
4. [Section 0 — Vitals](#section-0--vitals)
5. [Section 1 — Visit Reason](#section-1--visit-reason)
6. [FHIR-Compatible JSON Structure](#fhir-compatible-json-structure)
7. [Nested Questions — Parent-Child Relationship](#nested-questions--parent-child-relationship)
8. [Conditions — enableWhen](#conditions--enablewhen)
9. [All Conditions & Features Supported by AYU](#all-conditions--features-supported-by-ayu)
10. [Section 2 — Physical Examination](#section-2--physical-examination)
11. [Section 3 — Medical History](#section-3--medical-history)
12. [Component Rendering System](#component-rendering-system)
13. [Business Logic (ayu-library)](#business-logic-ayu-library)
14. [Hooks](#hooks)
15. [Context & Global State](#context--global-state)
16. [Types & Interfaces](#types--interfaces)
17. [Constants & Configuration](#constants--configuration)
18. [Data Flow Diagram](#data-flow-diagram)

---

## Architecture Overview

The Ayu module is split into two packages:

| Package         | Path                       | Purpose                                          |
| --------------- | -------------------------- | ------------------------------------------------ |
| **ayu**         | `src/modules/ayu/`         | React components, hooks, pages, services, assets |
| **ayu-library** | `src/modules/ayu-library/` | Platform-agnostic core logic, types, utilities   |

**Key design decisions:**

- FHIR Questionnaire JSON files are fetched from the API and transformed into an internal `AyuQuestion` schema via `fhir-to-ayu.util.ts`.
- The `decision-matrix.ts` maps FHIR question types to UI component types.
- The `useFHIRStepper` hook drives question-by-question navigation with validation.
- A React Context (`StartVisitContext`) holds completed section data for the final upload.

---

## Directory Structure

```
src/modules/ayu/
├── assets/
│   ├── icons/                          # SVG icon assets
│   └── physicalExamAssets/             # Medical examination images
├── components/
│   ├── common/                         # 14 reusable UI components
│   │   ├── ayu-text-input.component.tsx
│   │   ├── ayu-number-input.component.tsx
│   │   ├── ayu-date-input.component.tsx
│   │   ├── ayu-duration.component.tsx
│   │   ├── ayu-select.component.tsx
│   │   ├── ayu-multiselect.component.tsx
│   │   ├── ayu-selectable-option.component.tsx
│   │   ├── ayu-selectable-option-group.tsx
│   │   ├── ayu-associated-symptoms.component.tsx
│   │   ├── ayu-yes-no-button.component.tsx
│   │   ├── ayu-button.component.tsx
│   │   ├── ayu-group.component.tsx
│   │   ├── ayu-display-text.component.tsx
│   │   └── ayu-repeatable-text.component.tsx
│   ├── loaders/                        # Progress indicators
│   │   ├── question-loader.component.tsx
│   │   ├── section-completion-loader.component.tsx
│   │   └── side-loader.component.tsx
│   └── start-visit/                    # Main visit flow
│       ├── start-visit.component.tsx   # Orchestrator (4 sections)
│       ├── vitals/
│       │   └── vitals.component.tsx
│       ├── visit-reason/
│       │   ├── visit-reason.component.tsx
│       │   ├── ayu-stepper-container.component.tsx
│       │   ├── ayu-renderer.component.tsx
│       │   ├── ayu-nested-renderer.component.tsx
│       │   ├── reason-alphabetList.component.tsx
│       │   ├── reason-categoryList.component.tsx
│       │   ├── search-input.component.tsx
│       │   ├── selected-reasons.component.tsx
│       │   └── footer.tsx
│       ├── physical-examination/
│       │   ├── physical-examination.component.tsx
│       │   └── physical-exam-image-capture.component.tsx
│       └── medical-history/
│           └── medical-history.component.tsx
├── context/
│   └── start-visit.context.tsx         # Global visit state
├── data/
│   └── physical-exam.data.ts           # Hardcoded exam questions (~120+)
├── hooks/
│   ├── useFHIRStepper.hook.ts          # Question navigation & validation
│   ├── useVisitReasons.hook.ts         # Complaint selection & search
│   ├── usePhysicalExam.ts              # Physical exam state
│   ├── useAyuJsonList.ts              # JSON questionnaire fetching
│   └── useVitals.ts                    # Vitals form management
├── pages/
│   ├── ayu.page.tsx                    # Main page + routing
│   ├── visit-summary.page.tsx          # Final summary before upload
│   ├── component-map.ts               # Question type → React component
│   └── decision-matrix.ts             # Re-exports from ayu-library
├── services/                           # API calls, upload builders
├── types/
│   ├── vitals.types.ts
│   ├── observations.types.ts
│   └── visit-upload.types.ts
├── utils/
│   └── ayu.constants.ts               # UI labels, modal text, regex
└── constants/
    └── visit-upload.constants.ts       # OpenMRS encounter/concept UUIDs

src/modules/ayu-library/
├── logic/
│   ├── stepper.logic.ts               # Multi-select toggle, completion check
│   ├── enable-when.logic.ts           # Conditional visibility rules
│   ├── validation.logic.ts            # Required field validation
│   ├── associated-symptoms.logic.ts   # Yes/No toggle with exclusivity
│   ├── visit-reasons.logic.ts         # Name extraction, search, grouping
│   ├── visit-summary.logic.ts         # Answer → display text formatting
│   └── decision-matrix.ts             # FHIR type → UI component type
├── types/
│   ├── ayu.types.ts                   # Core question/answer types
│   ├── ayu-json.types.ts             # API response types
│   ├── fhir.types.ts                 # FHIR Questionnaire types
│   └── start-visit.types.ts          # Section props/state types
└── utils/
    ├── fhir-to-ayu.util.ts           # FHIR → AYU schema transform
    ├── question.utils.ts             # Option mapping, descendant utils
    └── constants.ts                   # FHIR extension URLs, dropdowns
```

---

## Visit Flow — 4 Sections

The visit is a **4-section linear flow** managed by `start-visit.component.tsx`:

```
┌──────────┐    ┌──────────────┐    ┌─────────────────────┐    ┌─────────────────┐    ┌───────────────┐
│  Vitals  │ →  │ Visit Reason │ →  │ Physical Examination│ →  │ Medical History  │ →  │ Visit Summary │
│ Section 0│    │  Section 1   │    │     Section 2       │    │    Section 3     │    │    (page)     │
└──────────┘    └──────────────┘    └─────────────────────┘    └─────────────────┘    └───────────────┘
```

Each section updates `StartVisitContext` on completion. After all 4 sections, the user is navigated to `/visit-summary` where data is uploaded.

---

## Section 0 — Vitals

**Component:** `vitals/vitals.component.tsx`
**Hook:** `useVitals`

**Fields (up to 18):**

| Field               | Key                      | Notes                              |
| ------------------- | ------------------------ | ---------------------------------- |
| Height              | `height_cm`              | Used for BMI calculation           |
| Weight              | `weight_kg`              | Used for BMI calculation           |
| BMI                 | `bmi`                    | Auto-calculated from height/weight |
| Systolic BP         | `bp_systolic`            | Range warning if out of bounds     |
| Diastolic BP        | `bp_diastolic`           | Range warning if out of bounds     |
| Pulse               | `pulse_bpm`              |                                    |
| Temperature         | `temprature_f`           |                                    |
| SpO2                | `spo2`                   |                                    |
| Respiratory Rate    | `respiratory_rate`       |                                    |
| FBS                 | `fbs_mg_per_dl`          | Fasting blood sugar                |
| PPBS                | `ppbs_mg_per_dl`         | Post-prandial blood sugar          |
| RBS                 | `rbs_mg_per_dl`          | Random blood sugar                 |
| Waist Circumference | `waist_circumference_cm` |                                    |
| Hip Circumference   | `hip_circumference_cm`   |                                    |
| Waist-to-Hip Ratio  | `waist_to_hip_ratio`     |                                    |
| OGTT                | `ogtt_mg_per_dl`         | Oral glucose tolerance             |
| HbA1c               | `hba1c`                  |                                    |
| Blood Group         | `blood_group`            | Dropdown selection                 |

**Conditions:**

- BMI is automatically recalculated when height or weight changes.
- BP values trigger out-of-range warnings (not blocking).
- Field visibility is driven by `vitalsConfig` from the API.

---

## Section 1 — Visit Reason

**Components:** `visit-reason/visit-reason.component.tsx`, `ayu-stepper-container.component.tsx`
**Hook:** `useVisitReasons`, `useFHIRStepper`

### Phase 1 — Complaint Selection

The user selects one or more complaints from a list:

- **Search**: Case-insensitive substring filtering (`filterNamesBySearch`)
- **Alphabet view**: Grouped A–Z (`groupByFirstLetter`)
- **Category view**: Grouped by category
- **Excluded names**: `famHist`, `physExam`, `patHist` are filtered out

After selection → **Confirm modal** shows selected complaints.

### Phase 2 — Questionnaire Stepper

For each selected complaint, the FHIR Questionnaire JSON is loaded and transformed:

```
API (JSON string) → parse → FhirQuestionnaire → fhir-to-ayu.util.ts → AyuQuestion[]
```

The stepper walks through **top-level questions** one at a time:

1. Render current question via `AyuRenderer` → `component-map.ts`
2. User answers → `setAnswer()` stores value
3. **Auto-advance condition**: Pure choice question with no string/input children → advance automatically
4. **Manual advance**: Questions with text inputs or nested children require "Next"/"Submit" button
5. After last question → **Summary modal** → user confirms or goes back to edit

### Stepper Validation Rules

| Rule                           | When Applied                                                 |
| ------------------------------ | ------------------------------------------------------------ |
| Required field empty           | All required questions must have a value                     |
| Duration incomplete            | Both number AND unit must be selected                        |
| Associated symptoms incomplete | Every symptom must be answered Yes or No                     |
| Nested children unanswered     | If parent option selected, visible children must be answered |
| Multi-select empty             | At least one option must be selected for `repeats` questions |

### Conditional Visibility (enableWhen)

Questions can be conditionally shown/hidden based on parent answers:

```typescript
// Example: Show "Duration" only when parent answer is "Yes"
enableWhen: [
  {
    question: 'parent-linkId',
    operator: '=',
    answerCoding: { code: 'yes', display: 'Yes' },
  },
];
```

**All** enableWhen conditions must be true (AND logic). Supported comparisons:

- `answerBoolean` — boolean match
- `answerString` — string equality
- `answerInteger` — integer equality
- `answerCoding` — code match (single value or within multi-select array)

When a parent answer changes, **all hidden descendants are auto-cleared** from the answers map.

### Multi-Select with Mutual Exclusivity

Choice questions with `repeats: true` support mutually exclusive options:

```
FHIR Extension: "exclude-from-multi-choice" = "True"
```

**Behavior:**

- Selecting an exclusive option (e.g., "None of the above") → clears all other selections
- Selecting a normal option → removes any exclusive option
- Implemented in `computeMultiSelectToggle()` in `stepper.logic.ts`

---

## FHIR-Compatible JSON Structure

AYU questionnaires follow the [FHIR Questionnaire](http://hl7.org/fhir/questionnaire.html) resource format. JSON files are fetched from the API and transformed via `fhir-to-ayu.util.ts` into the internal `AyuQuestion` schema.

### Top-Level Questionnaire

```json
{
  "resourceType": "Questionnaire",
  "id": "cough-questionnaire",
  "title": "Cough",
  "status": "active",
  "language": "en",
  "item": [
    {
      /* top-level question 1 */
    },
    {
      /* top-level question 2 */
    },
    {
      /* ... */
    }
  ]
}
```

The root `item` array holds all top-level questions. Questions with `type: "group"` are filtered out during stepper navigation — only non-group items become stepper steps.

### Real-World Example — "Timing" Question with Nested Children (from Cough.json)

Below is a real item from the Cough questionnaire. The parent is a `choice` question with 8 options. Two of those options ("Seasonal" and "Other") have nested child questions that appear **only when that specific option is selected**, controlled via `enableWhen`. Translations (`_text`, `_display`) are trimmed for readability.

```json
{
  "linkId": "ID-1487351204",
  "text": "Timing",
  "type": "choice",
  "required": true,
  "_text": {
    "extension": [
      /* translations: hi, or, gu, ... */
    ]
  },
  "extension": [
    {
      "url": "https://intelehealth.org/fhir/StructureDefinition/display",
      "valueString": "Is there a specific time of occurrence of cough?*"
    }
  ],
  "answerOption": [
    {
      "valueCoding": {
        "system": "https://intelehealth.org/fhir/CodeSystem/questionnaire-options",
        "code": "ID_24292147",
        "display": "Day"
      }
    },
    {
      "valueCoding": {
        "code": "ID_922917272",
        "display": "Night"
      }
    },
    {
      "valueCoding": {
        "code": "ID_735820484",
        "display": "Lying down"
      }
    },
    {
      "valueCoding": {
        "code": "ID_469820484",
        "display": "Talking"
      }
    },
    {
      "valueCoding": {
        "code": "ID_1232137411",
        "display": "Seasonal"
      }
    },
    {
      "valueCoding": {
        "code": "ID_328810484",
        "display": "Constant"
      }
    },
    {
      "valueCoding": {
        "code": "ID_842710484",
        "display": "Don't know"
      }
    },
    {
      "valueCoding": {
        "code": "ID_1165513348",
        "display": "Other[Describe]"
      }
    }
  ],

  "item": [
    {
      "linkId": "ID-1232137411",
      "text": "Seasonal",
      "type": "string",
      "enableWhen": [
        {
          "question": "ID-1487351204",
          "operator": "=",
          "answerCoding": {
            "system": "https://intelehealth.org/fhir/CodeSystem/questionnaire-options",
            "code": "ID_1232137411"
          }
        }
      ],
      "_text": {
        "extension": [
          /* translations */
        ]
      },
      "extension": [
        {
          "url": "https://intelehealth.org/fhir/StructureDefinition/language",
          "valueString": "%"
        }
      ]
    },
    {
      "linkId": "ID-1487351204_ID_1165513348",
      "text": "Other[Describe]",
      "type": "string",
      "enableWhen": [
        {
          "question": "ID-1487351204",
          "operator": "=",
          "answerCoding": {
            "system": "https://intelehealth.org/fhir/CodeSystem/questionnaire-options",
            "code": "ID_1165513348"
          }
        }
      ],
      "_text": {
        "extension": [
          /* translations */
        ]
      },
      "extension": [
        {
          "url": "https://intelehealth.org/fhir/StructureDefinition/language",
          "valueString": "%"
        }
      ]
    }
  ]
}
```

#### How This Renders at Runtime

```
┌─────────────────────────────────────────────────────┐
│ Is there a specific time of occurrence of cough?*   │
│                                                     │
│  [Day] [Night] [Lying down] [Talking]               │
│  [Seasonal] [Constant] [Don't know] [Other]         │
│                                                     │
│  ── User selects "Seasonal" ──                      │
│                                                     │
│  ┌───────────────────────────────────┐              │
│  │ Seasonal: [_______________]       │  ← nested    │
│  │           text input appears      │    child     │
│  └───────────────────────────────────┘              │
│                                                     │
│  ── Or user selects "Other[Describe]" ──            │
│                                                     │
│  ┌───────────────────────────────────┐              │
│  │ Other[Describe]: [____________]   │  ← nested    │
│  │                  text input       │    child     │
│  └───────────────────────────────────┘              │
└─────────────────────────────────────────────────────┘
```

#### Key Points from This Example

| Aspect                  | Detail                                                                                    |
| ----------------------- | ----------------------------------------------------------------------------------------- |
| **Parent → Child link** | Each child's `enableWhen.question` points to parent's `linkId` (`"ID-1487351204"`)        |
| **Option matching**     | Each child's `enableWhen.answerCoding.code` matches a specific parent `answerOption` code |
| **LinkId convention**   | "Other" child uses prefix pattern: `"ID-1487351204_ID_1165513348"` (parent + option)      |
| **Conditional display** | Child only visible when its matching option is selected; hidden + cleared otherwise       |
| **Display override**    | Parent uses `extension[display]` to show a longer question than `text: "Timing"`          |
| **Language marker**     | Children have `extension[language] = "%"` for special summary formatting                  |

### Question Item Structure

Every question item follows this shape:

```json
{
  "linkId": "ID_580858566",
  "text": "Do you have a cough?",
  "type": "choice",
  "required": true,
  "repeats": false,
  "readOnly": false,
  "answerOption": [
    /* ... */
  ],
  "enableWhen": [
    /* ... */
  ],
  "extension": [
    /* ... */
  ],
  "item": [
    /* nested child questions */
  ]
}
```

| Field          | Type                | Required | Description                                                                              |
| -------------- | ------------------- | -------- | ---------------------------------------------------------------------------------------- |
| `linkId`       | `string`            | Yes      | Unique identifier for the question                                                       |
| `text`         | `string`            | No       | Display text shown to the user                                                           |
| `type`         | `AyuQuestionType`   | Yes      | One of: `group`, `display`, `string`, `integer`, `decimal`, `date`, `choice`, `quantity` |
| `required`     | `boolean`           | No       | If `true`, must be answered before proceeding                                            |
| `repeats`      | `boolean`           | No       | If `true`, allows multi-select (answer stored as `string[]`)                             |
| `readOnly`     | `boolean`           | No       | If `true`, value cannot be edited                                                        |
| `answerOption` | `AyuAnswerOption[]` | No       | Available choices for `choice` type questions                                            |
| `enableWhen`   | `AyuEnableWhen[]`   | No       | Conditional visibility rules (see below)                                                 |
| `extension`    | `FhirExtension[]`   | No       | FHIR extensions for metadata (mutual exclusivity, display overrides, etc.)               |
| `item`         | `AyuQuestion[]`     | No       | Nested child questions (N-level nesting supported)                                       |

### Supported Question Types

| Type       | Answer Stored As       | UI Component               | Notes                             |
| ---------- | ---------------------- | -------------------------- | --------------------------------- |
| `group`    | —                      | Container                  | Filtered out by stepper           |
| `display`  | —                      | Read-only text             | Informational only                |
| `string`   | `string`               | Text input                 | `repeats: true` → multi-line      |
| `integer`  | `number`               | Numeric input              |                                   |
| `decimal`  | `number`               | Numeric input              |                                   |
| `date`     | `string`               | Date picker                |                                   |
| `choice`   | `string` or `string[]` | Button grid / Multi-select | `repeats: true` → multi-select    |
| `quantity` | `DurationAnswer`       | Number + unit dropdowns    | Both `number` and `days` required |

### Answer Option Format

```json
{
  "answerOption": [
    {
      "valueCoding": {
        "code": "ID_24292147",
        "display": "Yes"
      }
    },
    {
      "valueCoding": {
        "code": "ID_1232137411",
        "display": "No"
      },
      "extension": [
        {
          "url": "https://intelehealth.org/fhir/StructureDefinition/exclude-from-multi-choice",
          "valueString": "True"
        }
      ]
    }
  ]
}
```

Options use `valueCoding.code` as the stored answer value and `valueCoding.display` as the label. Options may have extensions (e.g., mutually exclusive flag).

### Answer Value Types

Answers are stored in a flat map: `Record<string, AyuAnswerValue>` keyed by `linkId`.

| Scenario                 | Stored Value                                      | Example                                     |
| ------------------------ | ------------------------------------------------- | ------------------------------------------- |
| Single-select choice     | `string` (the option code)                        | `"ID_24292147"`                             |
| Multi-select (`repeats`) | `string[]` (array of codes)                       | `["ID_123", "ID_456"]`                      |
| Text input               | `string`                                          | `"Patient reported dry cough"`              |
| Integer input            | `number`                                          | `45`                                        |
| Date input               | `string`                                          | `"2026-01-15"`                              |
| Duration / quantity      | `{ dropdownValues: { number: 5, days: "days" } }` | Both fields required for validation to pass |
| Associated symptoms      | `string[]` with `NO_` prefix for negated          | `["headache", "NO_nausea"]`                 |

---

## Nested Questions — Parent-Child Relationship

### How Nesting Works

The `item` key on any question holds its **child questions**. Children are only relevant (and rendered) when the parent has been answered. Nesting supports **unlimited depth** — children can themselves have children.

```
Parent Question (linkId: "q1", type: "choice")
├── Child Question (linkId: "q1.1", type: "string")    ← visible when q1 = "yes"
│   └── Grandchild (linkId: "q1.1.1", type: "choice")  ← visible when q1.1 has value
└── Child Question (linkId: "q1.2", type: "quantity")   ← visible when q1 = "other"
```

### Full Nested Example

```json
{
  "linkId": "ID_580858566",
  "text": "Is the cough productive?",
  "type": "choice",
  "required": true,
  "answerOption": [
    { "valueCoding": { "code": "ID_YES", "display": "Yes" } },
    { "valueCoding": { "code": "ID_NO", "display": "No" } }
  ],
  "item": [
    {
      "linkId": "ID_580858566.duration",
      "text": "For how long?",
      "type": "quantity",
      "enableWhen": [
        {
          "question": "ID_580858566",
          "operator": "=",
          "answerCoding": { "code": "ID_YES" }
        }
      ]
    },
    {
      "linkId": "ID_580858566.color",
      "text": "What color is the sputum?",
      "type": "choice",
      "answerOption": [
        { "valueCoding": { "code": "ID_WHITE", "display": "White" } },
        { "valueCoding": { "code": "ID_YELLOW", "display": "Yellow" } },
        { "valueCoding": { "code": "ID_OTHER", "display": "Other" } }
      ],
      "enableWhen": [
        {
          "question": "ID_580858566",
          "operator": "=",
          "answerCoding": { "code": "ID_YES" }
        }
      ],
      "item": [
        {
          "linkId": "ID_580858566.color.describe",
          "text": "Describe",
          "type": "string",
          "enableWhen": [
            {
              "question": "ID_580858566.color",
              "operator": "=",
              "answerCoding": { "code": "ID_OTHER" }
            }
          ]
        }
      ]
    }
  ]
}
```

**What happens at runtime:**

1. User answers parent "Is the cough productive?" → `"ID_YES"`
2. Both children become visible (their `enableWhen` matches)
3. User fills "For how long?" → `{ dropdownValues: { number: 3, days: "days" } }`
4. User selects "Other" for sputum color → `"ID_OTHER"`
5. Grandchild "Describe" becomes visible
6. User types description → `"greenish tint"`

**Resulting answers map:**

```typescript
{
  "ID_580858566":                "ID_YES",
  "ID_580858566.duration":       { dropdownValues: { number: 3, days: "days" } },
  "ID_580858566.color":          "ID_OTHER",
  "ID_580858566.color.describe": "greenish tint"
}
```

### Parent-Child Matching Strategies

When validating nested children, the system needs to determine **which parent answer option a child belongs to**. This is handled by `findMatchingOptionCode()` in `question.utils.ts` using two strategies:

| Strategy                 | How It Works                                                                  | Example                                                            |
| ------------------------ | ----------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| **LinkId prefix match**  | Child's `linkId` starts with a parent option's `valueCoding.code`             | Parent option `"optA"`, child linkId `"optA.duration"`             |
| **EnableWhen reference** | Child's `enableWhen` references the parent linkId with a specific answer code | `enableWhen: [{ question: "q1", answerCoding: { code: "optA" } }]` |

If a child maps to a specific option, it is **only validated when that option is selected**.

### Auto-Clearing Hidden Descendants

When a parent answer changes, all children whose `enableWhen` conditions are no longer met are **automatically cleared** from the answers map, including their descendants at all depths. This is handled by `clearHiddenDescendantAnswers()`.

```
User selects "Yes" → duration child becomes visible, user enters "5 days"
User changes to "No" → duration child hidden → answer "5 days" auto-deleted
```

---

## Conditions — enableWhen

### Structure

```json
{
  "enableWhen": [
    {
      "question": "parent-linkId",
      "operator": "=",
      "answerCoding": { "code": "expected-code" }
    }
  ]
}
```

Every `enableWhen` rule references a **parent question** by its `linkId` and specifies the expected answer value. **All rules must be true** (AND logic) for the child to be visible.

### Supported Operators

| Operator | Description     | Validated In          |
| -------- | --------------- | --------------------- |
| `=`      | Equality        | `fhir-to-ayu.util.ts` |
| `!=`     | Inequality      | `fhir-to-ayu.util.ts` |
| `exists` | Existence check | `fhir-to-ayu.util.ts` |

Only these three operators are accepted. Any other operator throws an error during FHIR-to-AYU transformation.

### Supported Answer Condition Types

Each rule must specify **exactly one** answer condition. They are evaluated in this priority order (first non-null wins):

| Condition      | JSON Key        | Matches Against         | Example                                |
| -------------- | --------------- | ----------------------- | -------------------------------------- |
| Boolean        | `answerBoolean` | Boolean parent answer   | `"answerBoolean": true`                |
| String         | `answerString`  | String parent answer    | `"answerString": "yes"`                |
| Integer        | `answerInteger` | Numeric parent answer   | `"answerInteger": 42`                  |
| Coded (choice) | `answerCoding`  | Option code from parent | `"answerCoding": { "code": "ID_YES" }` |

### Condition Examples

#### Single condition — show child when parent is "Yes"

```json
{
  "linkId": "q1.duration",
  "text": "For how long?",
  "type": "quantity",
  "enableWhen": [
    {
      "question": "q1",
      "operator": "=",
      "answerCoding": { "code": "yes" }
    }
  ]
}
```

#### Multiple conditions (AND logic) — show when both match

```json
{
  "enableWhen": [
    {
      "question": "q1",
      "operator": "=",
      "answerCoding": { "code": "yes" }
    },
    {
      "question": "q2",
      "operator": "=",
      "answerInteger": 1
    }
  ]
}
```

Both conditions must be true for the child to be visible.

#### Multi-select parent — child visible when option is in array

When a parent has `repeats: true`, the answer is stored as `string[]`. The `enableWhen` evaluator checks whether the expected code is **included** in the array:

```typescript
// Parent answer: ["optA", "optB"]
// enableWhen: { question: "parent", answerCoding: { code: "optA" } }
// Result: true (because "optA" is in the array)
```

### Evaluation Logic (`enable-when.logic.ts`)

```
1. No enableWhen defined → always visible
2. For each rule:
   a. Extract expected value: answerBoolean ?? answerString ?? answerInteger ?? answerCoding.code
   b. Get parent answer from answers map
   c. If parent answer is array → check if expected is included
   d. If parent answer is scalar → check strict equality
3. ALL rules must pass (AND logic)
```

### Mutual Exclusivity in Multi-Select

For `choice` questions with `repeats: true` (multi-select), individual answer options can be marked as **mutually exclusive** using a FHIR extension. This is separate from `enableWhen` — it controls option toggling behavior within a single question.

#### Extension Format

```json
{
  "answerOption": [
    { "valueCoding": { "code": "opt_headache", "display": "Headache" } },
    { "valueCoding": { "code": "opt_nausea", "display": "Nausea" } },
    {
      "valueCoding": { "code": "opt_none", "display": "None of the above" },
      "extension": [
        {
          "url": "https://intelehealth.org/fhir/StructureDefinition/exclude-from-multi-choice",
          "valueString": "True"
        }
      ]
    }
  ]
}
```

The extension URL is `https://intelehealth.org/fhir/StructureDefinition/exclude-from-multi-choice` with `valueString: "True"`.

#### Toggle Behavior (`computeMultiSelectToggle` in `stepper.logic.ts`)

| User Action                                | Result                                                                |
| ------------------------------------------ | --------------------------------------------------------------------- |
| Select exclusive option ("None")           | All other selections cleared; only "None" remains                     |
| Deselect exclusive option ("None")         | All selections cleared (empty array)                                  |
| Select normal option while "None" selected | "None" removed; normal option added                                   |
| Select/deselect normal option              | Standard toggle (add/remove from array); exclusive options unaffected |

#### Detection Logic (`isMutuallyExclusiveOption` in `stepper.logic.ts`)

```typescript
// Checks if a specific option code is marked exclusive
isMutuallyExclusiveOption(question, optionCode);
// → Looks for the extension on the matching answerOption
// → Returns true if extension url matches AND valueString === "True"
```

#### Example Walkthrough

```
Initial state: []

1. User clicks "Headache"    → ["opt_headache"]
2. User clicks "Nausea"      → ["opt_headache", "opt_nausea"]
3. User clicks "None"        → ["opt_none"]           ← clears all others
4. User clicks "Headache"    → ["opt_headache"]        ← removes "None"
5. User clicks "Headache"    → []                      ← deselect
```

#### Associated Symptoms Variant

For questions rendered as `associatedSymptoms` (Yes/No grid), the same exclusive extension applies but with different toggle logic via `toggleAssociatedSymptom()`:

- Clicking **Yes** on an exclusive option → clears all other Yes answers, sets only this one
- Clicking **No** on an exclusive option → normal No toggle
- Clicking **Yes** on a normal option → removes any exclusive Yes answer, adds this one
- No answers use `NO_` prefix: `["opt_headache", "NO_opt_nausea"]`

---

## All Conditions & Features Supported by AYU

### Question-Level Conditions

| Condition              | JSON Key     | Effect                                                  |
| ---------------------- | ------------ | ------------------------------------------------------- |
| Required               | `required`   | Must be answered; blocks navigation if empty            |
| Multi-select           | `repeats`    | Answer stored as array; at least one selection required |
| Read-only              | `readOnly`   | Displayed but not editable                              |
| Conditional visibility | `enableWhen` | Hidden unless all conditions pass                       |
| Nested children        | `item`       | Sub-questions shown when parent is answered             |

### Answer Option-Level Conditions

| Condition          | Extension URL                              | Effect                                                     |
| ------------------ | ------------------------------------------ | ---------------------------------------------------------- |
| Mutually exclusive | `.../exclude-from-multi-choice` = `"True"` | Selecting it clears all others; selecting others clears it |

### FHIR Extensions

| Extension URL                                                                 | Value        | Purpose                                                         |
| ----------------------------------------------------------------------------- | ------------ | --------------------------------------------------------------- |
| `urn:intelehealth:original-question-text`                                     | `string`     | Maps to original question label (e.g., "Duration", "Timing")    |
| `https://intelehealth.org/fhir/StructureDefinition/exclude-from-multi-choice` | `"True"`     | Marks option as mutually exclusive in multi-select              |
| `https://intelehealth.org/fhir/StructureDefinition/display`                   | `string`     | Overrides display text for summary formatting                   |
| `https://intelehealth.org/fhir/StructureDefinition/language`                  | `"%"` / text | Language marker; `%` triggers special family history formatting |
| `http://hl7.org/fhir/StructureDefinition/translation`                         | nested ext.  | Multi-language translations (`lang` + `content` pairs)          |

### Validation Rules (enforced before summary modal)

| Rule                            | Checked By                           | Toast Message                                 |
| ------------------------------- | ------------------------------------ | --------------------------------------------- |
| Required question unanswered    | `isEmpty(answer)`                    | "Please select any one option"                |
| Nested input child empty        | `isNestedInputValueMissing()`        | "Please enter a value"                        |
| Nested choice child empty       | `hasUnansweredRequiredNestedChild()` | "Please select any one option"                |
| Duration missing number or unit | `isQuantityInvalid()`                | "Please enter a value"                        |
| Multi-select with no selections | `isEmpty(answer)` on repeats         | "Please select any one option"                |
| Associated symptoms incomplete  | All options must be Yes or No        | "All questions are compulsory, please answer" |

### Associated Symptoms Special Behavior

Questions with `text: "Associated symptoms"` receive special treatment:

| Feature            | Behavior                                                      |
| ------------------ | ------------------------------------------------------------- |
| Rendering          | Yes/No button grid instead of regular options                 |
| Answer storage     | Yes → `"code"`, No → `"NO_code"` (prefix convention)          |
| Mutual exclusivity | "None" option clears all; selecting any symptom clears "None" |
| Strict mode        | Every symptom must be answered (not just one)                 |
| Summary format     | Split into "Patient reports: X, Y" / "Patient denies: A, B"   |

### Duration / Quantity Fields

| Feature        | Behavior                                          |
| -------------- | ------------------------------------------------- |
| Number range   | 1–100 (dropdown)                                  |
| Unit options   | Hours, Days, Weeks, Months, Years                 |
| Validation     | **Both** number AND unit must be selected         |
| Storage format | `{ dropdownValues: { number: 5, days: "days" } }` |
| Display format | `"5 days"` in summary                             |

### Multi-Language Support

Questions and options can include translations via FHIR's standard translation extension:

```json
{
  "text": "Do you have fever?",
  "_text": {
    "extension": [
      {
        "url": "http://hl7.org/fhir/StructureDefinition/translation",
        "extension": [
          { "url": "lang", "valueCode": "hi" },
          { "url": "content", "valueString": "क्या आपको बुखार है?" }
        ]
      }
    ]
  }
}
```

---

## Section 2 — Physical Examination

**Component:** `physical-examination/physical-examination.component.tsx`
**Hook:** `usePhysicalExam`
**Data:** `data/physical-exam.data.ts`

Unlike the FHIR-driven sections, physical exam uses **hardcoded question definitions** (~120+ questions).

### Question Structure

```typescript
{
  id: string,
  sectionLabel: string,       // e.g., "Head", "Chest", "Abdomen"
  categoryLabel: string,      // e.g., "General", "Eyes", "ENT"
  questionText: string,       // The actual question
  isRequired: boolean,
  isMultiChoice: boolean,     // Multiple options selectable
  options: PhysicalExamOption[],
  showWhen?: {                // Conditional visibility
    questionId: string,
    optionId: string
  },
  jobAidType?: 'image' | 'video',  // Reference material
  jobAidFile?: string
}
```

### Conditions

| Condition                              | Behavior                                                                    |
| -------------------------------------- | --------------------------------------------------------------------------- |
| `isRequired: true`                     | Must be answered before section completes                                   |
| `isMultiChoice: true`                  | Multiple options can be selected                                            |
| `showWhen` present                     | Question only visible when referenced question has specific option selected |
| `isExclusiveOption: true` on an option | Selecting it deselects all other options                                    |
| `isCamera: true` on an option          | Opens camera capture for image upload                                       |

### Filtering by Visit Reason

Physical exam questions are filtered based on the selected visit reason via `physicalExamFilter`. Only relevant body system questions are shown.

---

## Section 3 — Medical History

**Component:** `medical-history/medical-history.component.tsx`
**Hook:** `useFHIRStepper` (reused)

This section processes **two FHIR Questionnaire files** sequentially:

1. **Patient History** (`patHist.json`) — Personal medical history
2. **Family History** (`famHist.json`) — Family medical conditions

### Flow

```
patHist stepper → Summary modal → famHist stepper → Summary modal → Combined summary → Confirm
```

Each file uses the same `useFHIRStepper` hook and `AyuStepperContainer` as Visit Reason, with identical validation and navigation logic.

### Special Handling

- **Associated Symptoms in History**: Questions matching "Associated symptoms" text render as `AyuAssociatedSymptoms` (Yes/No grid) — but only for exact match. Patient/Family history items use `selectableOptionGroup` instead.
- **Language Extension**: The `%` language tag in FHIR extensions is used for family history labels (e.g., distinguishing "Mother", "Father" sections).
- **Summary format**: History answers are formatted as `"Medical history – [Condition] – [details]"`.

---

## Component Rendering System

### Decision Matrix (`decision-matrix.ts`)

Maps FHIR question types to UI component types:

| FHIR Type                            | Repeats | Resolved Component      | UI                     |
| ------------------------------------ | ------- | ----------------------- | ---------------------- |
| `choice`                             | `true`  | `multi-select`          | Checkbox list          |
| `choice`                             | `false` | `selectableOptionGroup` | Button grid            |
| `string`                             | `true`  | `repeatable-text`       | Multiple text inputs   |
| `string`                             | `false` | `text`                  | Single text input      |
| `integer` / `decimal`                | —       | `number`                | Numeric input          |
| `date`                               | —       | `date`                  | Date picker            |
| `quantity`                           | —       | `quantity`              | Number + unit dropdown |
| `display`                            | —       | `display`               | Read-only text         |
| `group`                              | —       | `group`                 | Container              |
| _any_ (text = "Associated symptoms") | —       | `associatedSymptoms`    | Yes/No grid            |

### Component Map (`component-map.ts`)

```typescript
{
  'group'                  → AyuGroup,
  'display'                → AyuDisplayText,
  'text'                   → AyuTextInput,
  'repeatable-text'        → AyuRepeatableText,
  'number'                 → AyuNumberInput,
  'date'                   → AyuDateInput,
  'select'                 → AyuSelect,
  'selectableOptionGroup'  → AyuSelectableOptionGroup,
  'multi-select'           → AyuMultiSelect,
  'quantity'               → AyuDuration,
  'associatedSymptoms'     → AyuAssociatedSymptoms,
}
```

### Rendering Pipeline

```
AyuStepperContainer
  → AyuRenderer (resolves component type via decision-matrix)
    → Specific Component (e.g., AyuTextInput)
    → AyuNestedRenderer (if question has children)
      → AyuRenderer (recursive for each visible child)
```

---

## Business Logic (ayu-library)

### `stepper.logic.ts` — Multi-Select & Completion

| Function                                              | Purpose                                              |
| ----------------------------------------------------- | ---------------------------------------------------- |
| `isDurationAnswer(value)`                             | Check if value has `dropdownValues` structure        |
| `isMutuallyExclusiveOption(option)`                   | Check FHIR extension for `exclude-from-multi-choice` |
| `computeMultiSelectToggle(current, clicked, options)` | Handle mutual exclusivity in multi-select            |
| `isTopLevelComplete(question, answers)`               | Recursively validate all nested children answered    |

### `enable-when.logic.ts` — Conditional Visibility

| Function                                  | Purpose                                          |
| ----------------------------------------- | ------------------------------------------------ |
| `evaluateEnableWhen(enableWhen, answers)` | Returns `true` if ALL enableWhen conditions pass |

**Supported operators:** `=` with `answerBoolean`, `answerString`, `answerInteger`, `answerCoding`.

For array answers (multi-select), checks if the expected value is **included** in the array.

### `validation.logic.ts` — Required Field Validation

| Function                                              | Purpose                                             |
| ----------------------------------------------------- | --------------------------------------------------- |
| `isEmpty(value)`                                      | Null, undefined, empty string, or empty array       |
| `hasVisibleRequiredNestedString(question, answers)`   | Find unanswered text inputs in children             |
| `hasUnansweredRequiredNestedChild(question, answers)` | Recursively check all required children             |
| `isNestedInputValueMissing(question, answers)`        | Determine if failure is missing input vs. selection |
| `isQuantityInvalid(value)`                            | Duration must have both number AND unit             |

### `associated-symptoms.logic.ts` — Yes/No Grid

| Function                                                 | Purpose                                               |
| -------------------------------------------------------- | ----------------------------------------------------- |
| `parseYesNoValues(values)`                               | Parse array: yes codes as-is, no codes prefixed `NO_` |
| `hasExclusiveSelected(values, options)`                  | Check if exclusive option (e.g., "None") is selected  |
| `toggleAssociatedSymptom(current, code, isYes, options)` | Toggle with exclusivity rules                         |

**Prefix conventions:**

- Yes answer: stored as `"code"` (e.g., `"headache"`)
- No answer: stored as `"NO_code"` (e.g., `"NO_headache"`)

### `visit-reasons.logic.ts` — Complaint List

| Function                             | Purpose                                           |
| ------------------------------------ | ------------------------------------------------- |
| `extractVisitReasonNames(items)`     | Clean filenames, exclude patHist/physExam/famHist |
| `filterNamesBySearch(names, search)` | Case-insensitive substring match                  |
| `groupByFirstLetter(names)`          | Organize alphabetically (A–Z groups)              |

### `visit-summary.logic.ts` — Summary Formatting

| Function                                | Purpose                                           |
| --------------------------------------- | ------------------------------------------------- |
| `buildVisitSummary(questions, answers)` | Convert answers to `SummarySection[]` for display |

**Answer type handling:**

| Answer Type             | Display Format                                   |
| ----------------------- | ------------------------------------------------ |
| Associated Symptoms     | "Patient reports: X, Y" / "Patient denies: A, B" |
| Patient/Family History  | "Medical history – Diabetes – 2020"              |
| Multi-select            | Comma-separated values                           |
| Single-select           | Display value                                    |
| String/Integer/Quantity | Direct value                                     |

### `decision-matrix.ts` — Type Resolution

| Function                               | Purpose                                                   |
| -------------------------------------- | --------------------------------------------------------- |
| `isStrictAssociatedSymptoms(question)` | True only for "Associated symptoms" (not patHist/famHist) |
| `resolveAyuComponent(question)`        | Map FHIR type → UI component type string                  |

---

## Hooks

### `useFHIRStepper(props)`

The core navigation engine for FHIR-based question sections.

**State:**

- `currentIndex` — Active top-level question index
- `answers` — `Record<string, AyuAnswerValue>` mapping linkId → value
- `showAll` — Review mode (render all questions)

**Key behaviors:**

- `setAnswer(linkId, value)` — Stores answer, clears hidden descendants, may auto-advance
- Auto-advance triggers when: choice question selected AND no visible string/input children remain unanswered
- `goNext()` — Validates current question, advances or shows summary
- Summary modal → "Change" returns to specific question for editing

### `useVisitReasons()`

**Returns:**

- `search` / `setSearch` — Search term state
- `filteredNames` — Filtered complaint names
- `selectedReasons` — Currently selected complaint names
- `addReason(name)` / `removeReason(name)` — Toggle selection
- `grouped` — Alphabetically grouped names
- `selectedComplaints` — Full `AyuJsonItem[]` for selected complaints
- `ayuConfigFiles` — All available config files

### `useVitals(onNextQuestion)`

- Uses React Hook Form for validation
- Auto-calculates BMI from height/weight
- Triggers out-of-range warnings for BP values
- Calls `onNextQuestion()` on valid submit

### `usePhysicalExam(sectionProps)`

- Manages question index, answers, and camera images
- Filters questions by `showWhen` dependencies
- Tracks required questions answered count
- Handles exclusive option deselection

### `useAyuJsonList(keyName)`

- Fetches questionnaire JSONs from API by key (default: `IDA6`)
- Parses JSON strings to `FhirQuestionnaire` objects
- Caches results

---

## Context & Global State

### `StartVisitContext`

```typescript
interface StartVisitData {
  vitals: {
    formValues: VitalsFormValues;
    config: VitalField[];
  } | null;

  visitReason: {
    answers: Record<string, AyuAnswerValue>;
    reasonNames: string[];
    details: string; // Formatted text for upload
  } | null;

  physicalExam: {
    answers: PhysicalExamAnswers; // Record<string, string[]>
  } | null;

  medicalHistory: {
    patHistSummary: SummarySection[];
    famHistSummary: SummarySection[];
  } | null;
}
```

Each section updates its slice on completion. The `visit-summary.page.tsx` reads the full context to build the upload payload.

---

## Types & Interfaces

### Core Question Type

```typescript
type AyuQuestionType =
  | 'group'
  | 'display'
  | 'string'
  | 'integer'
  | 'decimal'
  | 'date'
  | 'choice'
  | 'quantity';

interface AyuQuestion {
  linkId: string;
  text?: string;
  type: AyuQuestionType;
  required?: boolean;
  repeats?: boolean; // true = multi-select
  answerOption?: AyuAnswerOption[];
  enableWhen?: AyuEnableWhen[]; // Conditional visibility
  extension?: FhirExtension[];
  item?: AyuQuestion[]; // Nested children
}
```

### Conditional Visibility

```typescript
interface AyuEnableWhen {
  question: string; // Parent linkId
  operator: string; // '=' | '!=' | 'exists'
  answerBoolean?: boolean;
  answerString?: string;
  answerInteger?: number;
  answerCoding?: { code: string; display?: string };
}
```

### Answer Values

```typescript
type AyuAnswerValue =
  | string
  | number
  | boolean
  | DurationAnswer
  | QuantityAnswer
  | string[]
  | null
  | undefined;

interface DurationAnswer {
  dropdownValues: {
    number?: string | number | null;
    days?: string | null; // 'hours' | 'days' | 'weeks' | 'months' | 'years'
  };
}

interface QuantityAnswer {
  value?: number | string | null;
  unit?: string;
}
```

### Physical Exam

```typescript
interface PhysicalExamQuestion {
  id: string;
  sectionLabel: string;
  categoryLabel: string;
  questionText: string;
  isRequired: boolean;
  isMultiChoice: boolean;
  jobAidType?: 'image' | 'video';
  jobAidFile?: string;
  options: PhysicalExamOption[];
  showWhen?: { questionId: string; optionId: string };
}

interface PhysicalExamOption {
  id: string;
  text: string;
  isCamera?: boolean;
  isExclusiveOption?: boolean;
  excludeFromMulti?: boolean;
}
```

---

## Constants & Configuration

### FHIR Extension URLs (`ayu-library/utils/constants.ts`)

| Extension                                 | Purpose                                       |
| ----------------------------------------- | --------------------------------------------- |
| `urn:intelehealth:original-question-text` | Original untranslated question text           |
| `.../exclude-from-multi-choice`           | Marks option as mutually exclusive (`"True"`) |
| `.../display`                             | Override display text for summaries           |
| `.../language`                            | Language tag; `%` = family history label      |

### UI Constants (`ayu/utils/ayu.constants.ts`)

| Constant                    | Value                                           |
| --------------------------- | ----------------------------------------------- |
| `AYU_JSON_KEY_NAME`         | `'IDA6'`                                        |
| `CONFIRM_MODAL_TITLE`       | `"Confirm visit reason?"`                       |
| `BUTTON_NEXT`               | `"Next"`                                        |
| `BUTTON_SUBMIT`             | `"Submit"`                                      |
| `BUTTON_SKIP`               | `"Skip"`                                        |
| `VALIDATION_ALL_COMPULSORY` | `"All questions are compulsory, please answer"` |
| `VALIDATION_ENTER_VALUE`    | `"Please enter a value"`                        |
| `VALIDATION_SELECT_OPTION`  | `"Please select any one option"`                |

### Associated Symptoms Labels (`ayu-library/utils/constants.ts`)

| Constant                   | Value                   |
| -------------------------- | ----------------------- |
| `ASSOCIATED_SYMPTOMS_TEXT` | `'Associated symptoms'` |
| `NEGATED_PREFIX`           | `'NO_'`                 |
| `PATIENT_REPORTS_LABEL`    | `'Patient reports'`     |
| `PATIENT_DENIES_LABEL`     | `'Patient denies'`      |

### Duration Dropdowns

- **Number range:** 1–100
- **Unit options:** Hours, Days, Weeks, Months, Years

### OpenMRS UUIDs (`ayu/constants/visit-upload.constants.ts`)

| Key                              | UUID           | Purpose                  |
| -------------------------------- | -------------- | ------------------------ |
| `ENCOUNTER_TYPES.VITALS`         | `67a71486-...` | Vitals encounter         |
| `ENCOUNTER_TYPES.ADULT_INITIAL`  | `8d5b27bc-...` | Adult initial encounter  |
| `ENCOUNTER_TYPES.VISIT_COMPLETE` | `ca5f5dc3-...` | Visit complete encounter |

---

## Data Flow Diagram

```
                        ┌─────────────────────┐
                        │    API (Mindmap)     │
                        │  FHIR Questionnaire  │
                        │   JSON files (IDA6)  │
                        └──────────┬──────────┘
                                   │
                          useAyuJsonList()
                                   │
                        ┌──────────▼──────────┐
                        │  fhir-to-ayu.util   │
                        │  Transform to AYU    │
                        │  question schema     │
                        └──────────┬──────────┘
                                   │
                    ┌──────────────▼──────────────┐
                    │      ayu.page.tsx            │
                    │  Stores transformed schemas  │
                    └──────────────┬──────────────┘
                                   │
                    ┌──────────────▼──────────────┐
                    │   start-visit.component      │
                    │   Orchestrates 4 sections    │
                    └──┬───────┬───────┬───────┬──┘
                       │       │       │       │
              ┌────────▼┐ ┌───▼────┐ ┌▼─────┐ ┌▼──────────┐
              │ Vitals  │ │ Visit  │ │Phys. │ │ Medical   │
              │         │ │ Reason │ │ Exam │ │ History   │
              └────┬────┘ └───┬────┘ └──┬───┘ └─────┬─────┘
                   │          │         │            │
                   │    useFHIRStepper  │     useFHIRStepper
                   │          │         │            │
                   └────┬─────┴────┬────┘────────────┘
                        │          │
                        ▼          ▼
              ┌─────────────┐  ┌──────────────────┐
              │ StartVisit  │  │  AyuRenderer →    │
              │  Context    │  │  ComponentMap →   │
              │ (stores     │  │  UI Component     │
              │  results)   │  └──────────────────┘
              └──────┬──────┘
                     │
              ┌──────▼──────┐
              │visit-summary │
              │   page       │
              │ (upload)     │
              └─────────────┘
```

---

## Quick Reference — Adding a New Question Type

1. Add the type to `AyuQuestionType` in `ayu-library/types/ayu.types.ts`
2. Add resolution logic in `ayu-library/logic/decision-matrix.ts` → `resolveAyuComponent()`
3. Create the React component in `ayu/components/common/`
4. Register it in `ayu/pages/component-map.ts`
5. Add validation rules in `ayu-library/logic/validation.logic.ts` if needed
6. Add summary formatting in `ayu-library/logic/visit-summary.logic.ts`

## Quick Reference — Adding a New Section

1. Create section component in `ayu/components/start-visit/`
2. Add section data type to `StartVisitData` in `start-visit.context.tsx`
3. Register in `start-visit.component.tsx` section array
4. Update progress loaders to reflect new section count
5. Update `visit-summary.page.tsx` to include new section data in upload
