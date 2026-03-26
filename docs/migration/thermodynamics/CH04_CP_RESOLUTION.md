# CH04 — Cp Resolution: Unified Equation Framework

**Status: IMPLEMENTED ✅** — `common/thermal` is fully operational.

---

## Equation framework

`CompoundValue` stores multiple approximations per property in buckets:

```typescript
// interfaces/compound-value.interface.ts
interface CompoundValue {
  nasa7?: Nasa7Equation;            // top-level — covers Cp, H, S, G simultaneously
  heatCapacity: { def: number; values: EquationValue[] };
  viscosity:    { def: number; values: EquationValue[] };
  thermalConductivity: { def: number; values: EquationValue[] };
}

// interfaces/equation-value.interface.ts
interface EquationValue {
  type: EquationTypeDto;   // selects the evaluation class
  ref:  RefKey;            // enum → docs/REFERENCES.md — never a raw number
  page?: number;
  vars: Record<string, unknown>;
  min: number;             // valid T range [K]
  max: number;
  k?: number;              // optional post-multiply scaling factor
}
```

Each property bucket carries multiple entries from different sources. `def` picks the default.
Callers can override via `CompoundPropertyResolver` (see below).

---

## EquationTypeDto — implemented variants

```typescript
// dto/equation-type.dto.ts
export enum EquationTypeDto {
  linear                      = 'linear',
  quadratic                   = 'quadratic',
  cubic                       = 'cubic',
  quartic                     = 'quartic',
  linearHyperbolic            = 'linearHyperbolic',
  linearHyperbolicLogarithmic = 'linearHyperbolicLogarithmic',
  alyLee                      = 'alyLee',
  dipprN102                   = 'dipprN102',
  nasa7                       = 'nasa7',
}
```

`Common.equation(type)` dispatches to the appropriate method class. Callers never instantiate
equation methods directly.

---

## nasa7 — separate top-level field (NOT in heatCapacity.values)

NASA-7 coefficients simultaneously define Cp, H, S and G. They **do not belong in** any single
property bucket. They live as `CompoundValue.nasa7?: Nasa7Equation`.

```typescript
// type/nasa7-equation.ts
export type Nasa7Coeffs = {
  a1: number;
  a2: number;
  a3: number;
  a4: number;
  a5: number;
  /** Integration constant — encodes reference enthalpy Hf° at 298 K */
  a6: number;
  /** Integration constant — encodes reference entropy S° at 298 K */
  a7: number;
};

export type Nasa7Equation = {
  low:     Nasa7Coeffs;   // 200 K – Tswitch
  high:    Nasa7Coeffs;   // Tswitch – 6000 K
  Tswitch: number;        // typically 1000 K
};
```

Coefficients use **named fields** (`{a1…a7}`) — never tuple arrays.

✅ **Correct** (actual implementation):
```typescript
export const N2: CompoundValue = {
  nasa7: {
    Tswitch: 1000,
    low:  { a1: 3.531e+00, a2: -1.237e-04, a3: -5.030e-07, a4:  2.435e-09, a5: -1.409e-12, a6: -1047, a7: 2.967 },
    high: { a1: 2.953e+00, a2:  1.397e-03, a3: -4.926e-07, a4:  7.860e-11, a5: -4.608e-15, a6:  -924, a7: 5.872 },
  },
  heatCapacity: {
    def: 0,
    values: [
      // polynomial approximations (quartic, cubic, linear, alyLee)
      // nasa7 is NOT here
    ],
  },
};
```

---

## Nasa7EquationMethod — extra methods beyond Equation\<T\>

```typescript
// utils/nasa7-equation-method.ts
export class Nasa7EquationMethod implements Equation<Nasa7Equation> {
  // Cp/R = a1 + a2·T + a3·T² + a4·T³ + a5·T⁴  →  Cp [J/(mol·K)]
  calculate(T, vars, min, max, k?): number

  // Exact polynomial antiderivative: ∫Cp dT = R·(a1·T + a2·T²/2 + a3·T³/3 + a4·T⁴/4 + a5·T⁵/5)
  integral(T, vars, min, max, k?): number

  // Handles Tswitch boundary when T1 < Tswitch ≤ T2
  calculateAverage(T1, T2, vars, min, max, k?): number

  // H/RT = a1 + a2·T/2 + a3·T²/3 + a4·T³/4 + a5·T⁴/5 + a6/T  →  H [J/mol]
  enthalpy(T, vars): number

  // S/R = a1·ln T + a2·T + a3·T²/2 + a4·T³/3 + a5·T⁴/4 + a7  →  S [J/(mol·K)]
  entropy(T, vars): number

  // G = H − T·S  →  G [J/mol]
  gibbsEnergy(T, vars): number
}
```

`enthalpy`, `entropy`, `gibbsEnergy` are extra methods — not part of `Equation<T>`.
They are accessed via `CompoundPropertyResolver`.

---

## CompoundPropertyResolver — the only access point

```typescript
// utils/compound-property-resolver.ts
export type PreferredApprox = number | RefKey;

export class CompoundPropertyResolver {
  constructor(compound: CompoundValue) {}

  // Default: nasa7 if present; else values[def]
  heatCapacity(T: number, preferred?: PreferredApprox): number

  // Default: nasa7 if present; else values[def] integral
  heatCapacityAverage(T1: number, T2: number, preferred?: PreferredApprox): number

  // Requires nasa7; returns NaN if absent
  enthalpy(T: number): number
  entropy(T: number): number
  gibbsEnergy(T: number): number

  // Uses values[def] or overridden by preferred
  viscosity(T: number, preferred?: PreferredApprox): number
  thermalConductivity(T: number, preferred?: PreferredApprox): number
}
```

Preferred resolution order:
1. `preferred` is a number → `values[preferred]`
2. `preferred` is a `RefKey` → first entry with matching `ref`
3. `undefined` → `values[def]`

Falls back to `values[def]` silently if preferred entry not found.

---

## Closed-form vs numerical integrals

| Equation type | Integral | Verified via |
|---|---|---|
| `linear` | ✅ exact: `a·T + b·T²/2` | algebra |
| `quadratic` | ✅ exact: `a·T + b·T²/2 + c·T³/3` | algebra |
| `cubic` | ✅ exact: `a·T + b·T²/2 + c·T³/3 + d·T⁴/4` | algebra |
| `quartic` | ✅ exact: `a·T + b·T²/2 + c·T³/3 + d·T⁴/4 + e·T⁵/5` | algebra |
| `linearHyperbolic` | ✅ exact: `a·T + b·T²/2 − d/T` | algebra |
| `linearHyperbolicLogarithmic` | ✅ exact: `c1·T + c2·(T·ln T − T) + c3·ln T + c4·T²/2` | `RefKey.WolframAlpha` |
| `alyLee` | ✅ exact: `c1·T + c2·c3·coth(c3/T) − c4·c5·tanh(c5/T)` | `RefKey.WolframAlpha` |
| `dipprN102` | ❌ no closed form for arbitrary c2 — `gaussLegendre20` | `RefKey.WolframAlpha` |
| `nasa7` | ✅ exact (polynomial) | algebra |

`gaussLegendre20` lives in `common/utils/gauss-legendre.util.ts` (SRP).
`dippr-equation-102-method.ts` imports it from there.
`numeric.util.ts` re-exports it for backward compatibility.

---

## Gas compounds implemented

All 8 combustion-relevant species have full data in `common/thermal/compound/gas/`:

| File | Species | nasa7 | heatCapacity.values | viscosity | thermalConductivity |
|---|---|---|---|---|---|
| `n2.ts`  | N2  | ✅ | quartic, cubic, linear, alyLee | quadratic | quadratic, dipprN102 |
| `o2.ts`  | O2  | ✅ | quartic, cubic, linearHyperbolic, alyLee | quadratic | quadratic |
| `co2.ts` | CO2 | ✅ | quartic, cubic, linearHyperbolic, alyLee | quadratic | quadratic |
| `co.ts`  | CO  | ✅ | quartic, cubic | quadratic | quadratic |
| `h2o.ts` | H2O | ✅ | quartic, cubic | quadratic | quadratic |
| `h2.ts`  | H2  | ✅ | quartic, cubic | quadratic | quadratic |
| `ch4.ts` | CH4 | ✅ | quartic, cubic, alyLee | quadratic | quadratic |
| `nh3.ts` | NH3 | ✅ | quartic, cubic, alyLee | quadratic | quadratic, dipprN102 |

All nasa7 coefficients sourced from `RefKey.NASA7` (NASA TM-2002-211556) except NH3 from `RefKey.Burcat2005`.
All registered in `GAS_REGISTRY` (registry.ts).

---

## Which approximation for which use case

| Use case | Preferred | Reason |
|---|---|---|
| Energy balance (300–1800 K) | `values[def]` | Validated polynomial for the operating range |
| Combustion above 2000 K | `nasa7` | Only accurate source above 2000 K |
| Gibbs equilibrium, H/S/G | `nasa7` | Only equation type providing H, S, G |
| Cross-validation | all `values[]` | Use `cpCompare()` loop |

