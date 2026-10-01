# Step 08 — Forms infrastructure (react-hook-form plus yup)

**Commits:** 1
**Install (user):**

```bash
docker exec thermal-frontend sh -c 'cd /app && npm i @hookform/resolvers'
```

**Goal:** one way to build calculator forms, proven on the smallest form (Body geometry) before the section migrations.

---

## 1. Infrastructure (`src/shared/form/`)

| File | Content |
|------|---------|
| `types/number-field-spec.type.ts` | `{ key, label, unit?, min?, max?, required?, helper?, step? }`. `label` and `helper` become `labelKey` and `helperKey` in Step 09 |
| `types/select-option.type.ts` | `{ value, label }` |
| `types/calculator-form-config.type.ts` | `{ schema, defaultValues, toRequest }` |
| `types/calculator-form.type.ts` | The return type of `useCalculatorForm` |
| `schemas/build-number-fields-schema.ts` | Builds a yup object from `NumberFieldSpec[]`: `number().typeError(...)`, `min`, `max`, `required` or `nullable().optional()` |
| `schemas/yup-locale.ts` | `setLocale` with message objects `{ key, values }`. In this step the field wrapper renders them with a built-in English fallback; Step 09 switches the wrappers to `t()` |
| `hooks/useCalculatorForm.ts` | `useForm({ resolver: yupResolver(schema), defaultValues, mode: 'onSubmit', reValidateMode: 'onChange' })`. Keeps `request` state (last valid `toRequest(values)`); `submit = form.handleSubmit(v => setRequest(toRequest(v)))` |
| `components/FormNumberField.tsx` | `Controller` around `NumberField`; `error` and `helperText` from `fieldState` |
| `components/FormSelect.tsx` | `Controller` around `EnumSelect` |
| `components/FormCheckbox.tsx` | `Controller` around MUI `Checkbox` with label |
| `components/FormNumberFieldGrid.tsx` | Renders `NumberFieldSpec[]` with `LAYOUT` grid sizes. Replaces `processes/components/NumberFieldGrid.tsx` as each section migrates |
| `components/FormGasComposition.tsx`, `FormOxideComposition.tsx` | `Controller` around the existing composition inputs; the composition sum is validated by the schema |
| `components/CalculatorForm.tsx` | `<FormProvider>` plus `<form onSubmit={submit} noValidate>`, an error summary for errors at the root of the form, and `CalculateButton` (disabled while submitting) |

Rules:
- `useForm` is imported only in `useCalculatorForm.ts`. The `no-restricted-imports` warning from Step 02 enforces this.
- Mappers receive values the schema has already validated, and never throw.
- `toRequest` only converts: units (°C to K) and omitting empty optional fields.

## 2. Pilot: Body geometry (`processes/sections/htc`)

- Add `schemas/body-geometry-form.schema.ts`, built from `dimension-field-specs` and the shape's required dimensions.
- `BodyGeometryCalculator` uses `useCalculatorForm`, `CalculatorForm` and `FormNumberFieldGrid`. Its local `useState` calls, the `try/catch` and `formError` are removed.
- `body-geometry-request.mapper.ts` no longer checks required values. Its characterization test is updated: it no longer expects the "throws on missing value" case, because the schema now covers that.
- Component tests follow the full set from [TESTING.md §4.3](TESTING.md#43-component-tests-srctesttsx):
  - an empty dimension shows a field error;
  - changing the shape changes the visible fields and keeps the values that still apply.

## 3. Tests

- Unit tests:
  - `buildNumberFieldsSchema` handles min, max, required, optional and non-number input;
  - `useCalculatorForm` sets `request` only for valid values.
- Component tests: each wrapper shows its error; `CalculatorForm` doesn't call `onSubmit` while invalid.
- The Body geometry contract cases pass unchanged, which proves the request body is identical.

## 4. Acceptance

- `npm run verify` passes.
- In the browser, Body geometry behaves as before, except that errors now appear on the fields.
- Commit: `refactor(frontend): step 08 react-hook-form infrastructure, body geometry pilot`.
