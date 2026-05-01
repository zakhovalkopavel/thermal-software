# Thermodynamics API — Design Conventions

**Status:** Mandatory for all development on `/api/v1/thermodynamics/**` and `/api/v1/numeric/**`.

---

## 1. Unified Fluid Interface

Every endpoint that needs a fluid (dimensionless numbers, Nusselt, HTC, individual properties)
uses the **same flat fluid-identification fields** — never a nested object:

| Field | Type | Description |
|-------|------|-------------|
| `fluid` | `KnownFluid` | Named species/alias. Source of truth: `KNOWN_FLUIDS` constant in `types/known-fluid.type.ts`. |
| `composition` | `Record<Species, number>` | Mole fractions — required when `fluid = "gas_mix"` or `fluid` is absent. Must sum to 1. |
| `T_fluid_K` | `number` | Bulk temperature [K]. Always explicit; no magic defaults in DTOs (defaults only where documented). |
| `P_Pa` | `number` | Absolute pressure [Pa]. Default: `Common.pAtm` (101 325 Pa). |

**Rule:** exactly one of `fluid` or `composition` must be provided; using both is allowed only
when `fluid = "gas_mix"`.

### Single source of truth for fluid keys

The runtime array `KNOWN_FLUIDS` in `types/known-fluid.type.ts` is the **only** place where
fluid keys are listed. The `KnownFluid` type and all Swagger description strings are derived
from it:

```typescript
// types/known-fluid.type.ts
export const KNOWN_FLUIDS = [...] as const;
export type KnownFluid = typeof KNOWN_FLUIDS[number];
export const KNOWN_FLUID_DESCRIPTION: string = KNOWN_FLUIDS.map(f => `"${f}"`).join(', ');
```

In every DTO that shows a fluid field in Swagger, import and embed `KNOWN_FLUID_DESCRIPTION`:

```typescript
import { KNOWN_FLUID_DESCRIPTION } from '../types/known-fluid.type';

@ApiPropertyOptional({
  description: `Named fluid or species: ${KNOWN_FLUID_DESCRIPTION}. Required when composition is absent.`,
  example: 'air',
})
fluid?: KnownFluid;
```

**Never hardcode the fluid list as a string literal in a DTO description.**

---

## 2. Geometry Dimensions Field

Geometry inputs use a single nested object named **`dimensions`** (never `dims`) of type
`GeometryDimsDto`. Required sub-fields depend on the `geometry` key; optional sub-fields
are always `@ApiPropertyOptional`.

```typescript
dimensions: GeometryDimsDto;   // ✅
dims: GeometryDimsDto;         // ❌ — old name, do not use
```

The mapping of geometry → required dimension fields lives in `fluid-property.service.ts`
→ `getGeometryList()`. **Do not duplicate it in DTOs** — refer users to
`GET /thermodynamics/geometry/list`.

---

## 3. Prandtl Is Geometry-Free

`Pr = μ·Cp / λ` is a pure thermophysical property of the fluid.
`PrandtlInputDto` **must not** contain `geometry` or `dimensions`.
Any endpoint computing Pr from fluid state should accept only `fluid`/`composition` + `T_fluid_K`.

---

## 4. HTC Uses Same Input as Nusselt

`POST /thermodynamics/dimensionless/htc` accepts `DimensionlessInputDto` — identical to
`/dimensionless/nusselt`. Nu is computed internally; the caller never supplies a
pre-calculated `Nu` or `lambda`.

---

## 5. Gravity Override in Natural-Convection Endpoints

All endpoints that compute Gr or Ra accept an optional `g_m_s2` field
(default `Common.g = 9.80665 m/s²`). This allows simulation of non-standard
gravitational conditions without creating separate endpoint variants.

---

## 6. Correlation Validity Ranges — "Infinity" Not null

When a correlation has no upper bound on Re, Pr, or Ra, the range is serialised as
`[min, "Infinity"]` (the string `"Infinity"`, **not** `null` and **not** the JS `Infinity`
value which serialises as `null` in JSON).

Implementation lives in `fluid-property.service.ts` → `getCorrelationList()`.

---

## 7. Swagger Annotation Standards

### Required vs optional
- Required fields: `@ApiProperty` (no `Optional` suffix).
- Optional fields: `@ApiPropertyOptional`.
- Every field must have a `description`. Every field that accepts a specific
  value set must list it (derived from constants/enums, not typed manually).

### Examples
- Every `@Post` endpoint must have `@ApiBody({ examples: { … } })` with at least one
  minimal realistic example per logical variant (e.g. one per relevant geometry type
  for dimensionless endpoints).
- Example values must be physically realistic (real temperatures, real geometries,
  real fluid names) — never zero-filled placeholders.

### Minimal examples
Examples show only the fields required for that scenario:
```typescript
// ✅ sphere — only radius needed
{ geometry: 'sphere_forced', dimensions: { a: 0.03 }, fluid: 'N2', T_fluid_K: 800, w_m_s: 20 }

// ❌ over-specified — don't include unused fields
{ geometry: 'sphere_forced', dimensions: { a: 0.03, b: 0, c: 0 }, fluid: 'N2', T_fluid_K: 800, w_m_s: 20 }
```

---

## 8. Numeric Endpoints

All numeric endpoints (`/numeric/**`) are stateless pure-math wrappers.

### DTO location
Input DTOs live in the shared `dto/` folder and are exported from `dto/index.ts`:

| DTO file | Used by |
|---|---|
| `brentq-input.dto.ts` | `POST /numeric/brentq`, `POST /numeric/brent` |
| `nelder-mead-input.dto.ts` | `POST /numeric/nelder-mead` |
| `xy-input.dto.ts` | `POST /numeric/regression/linear`, `…/exponential`, `…/power` |
| `polynomial-fit-input.dto.ts` | `POST /numeric/regression/polynomial` |
| `levenberg-marquardt-input.dto.ts` | `POST /numeric/regression/levenberg-marquardt` |

Response shaping (formula strings, coefficient objects) is handled in
`src/common/utils/numeric-format.util.ts` — import helpers from there, **never**
build formula strings directly in the controller.

### Nelder-Mead — named variables

`POST /numeric/nelder-mead` accepts a **named-variable object** instead of an index-based
array. Variable names are defined as keys in `variables`; the same names are used in
`expression`.

```json
{
  "expression": "(x1-2)**2 + (x2-3)**2",
  "variables": { "x1": 0, "x2": 0 }
}
```

Keys are sorted alphabetically to produce a stable index mapping.  
The response mirrors the same named-variable format:

```json
{ "variables": { "x1": 2.0, "x2": 3.0 }, "fval": 0.0 }
```

**Never use `x[0]`, `x[1]` notation** in expressions sent to this endpoint.
The internal `nelderMead` wrapper in `numeric.util.ts` still takes a plain array — the
name↔index mapping is performed in the controller and is transparent to the utility.

### Regression responses — formula and named coefficients

All regression endpoints include a `formula` string in the response, built by the helpers
in `numeric-format.util.ts`. The polynomial endpoint additionally returns coefficients as a
**named object** instead of an array:

| Endpoint | Response shape |
|---|---|
| `regression/linear` | `{ slope, intercept, r2, formula }` |
| `regression/polynomial` | `{ coefficients: { c0, c1, …, cn }, r2, formula }` |
| `regression/exponential` | `{ A, B, r2, formula }` |
| `regression/power` | `{ A, B, r2, formula }` |
| `regression/levenberg-marquardt` | `{ parameterValues, parameterError, iterations, formula }` |

The `formula` field for `levenberg-marquardt` is produced by substituting the fitted
parameter values into the `modelExpression` string (see `lmFormula()` in
`numeric-format.util.ts`).

Polynomial `coefficients` are in **ascending degree order**: `c0` is the constant term,
`c1` is the coefficient of `x`, etc. (opposite to `numpy.polyfit` which returns descending
order).
