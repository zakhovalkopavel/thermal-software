# CH04 — Cp Resolution: Unified Equation Framework

## The framework already handles multiple approximations

`legacy/scripts/src` implements a general-purpose equation evaluation framework:

```
CompoundValue
  heatCapacity: { def: number, values: EquationValue[] }
  viscosity:    { def: number, values: EquationValue[] }
  thermalConductivity: { def: number, values: EquationValue[] }

EquationValue
  type: EquationTypeDto     ← selects the evaluation method
  ref:  number              ← literature reference index
  page: number              ← page in that reference
  vars: ...                 ← equation coefficients
  min, max: number          ← valid temperature range [K]
  k?: number                ← optional scaling factor
```

Each compound (e.g. `CO2`) already carries **multiple `EquationValue` entries** for the same property,
each from a different source/reference, all stored in `values[]`. The `def` index selects the preferred one.
`FluidConditionCompound.heatCapacity(t1, t2?)` evaluates the `def` equation, with average over [t1,t2]
computed analytically via the integral method on each equation class.

This is the **correct place** to add NASA-7. It must be a new `EquationTypeDto` variant.

---

## Decision: NASA-7 = new `EquationTypeDto.nasa7` variant

Add `nasa7 = "nasa7"` to `EquationTypeDto`. Add `Nasa7EquationMethod` to `utils/`. Store NASA-7
coefficients as additional `EquationValue` entries inside each compound's `heatCapacity.values[]`
array — alongside quartic, cubic, AlyLee, etc.

```typescript
// dto/equationType.dto.ts — add one entry
export enum EquationTypeDto {
  linear                      = "linear",
  quadratic                   = "quadratic",
  cubic                       = "cubic",
  quartic                     = "quartic",
  linearHyperbolic            = "linearHyperbolic",
  linearHyperbolicLogarithmic = "linearHyperbolicLogarithmic",
  alyLee                      = "alyLee",
  dipprN102                   = "dipprN102",
  nasa7                       = "nasa7",   // ← NEW
}
```

```typescript
// type/nasa7Equation.ts — new type
export interface Nasa7Equation {
  // low-T coefficients (200–1000 K)
  low:  [number, number, number, number, number, number, number];
  // high-T coefficients (1000–6000 K)
  high: [number, number, number, number, number, number, number];
  Tswitch: number;   // default 1000
}
```

```typescript
// utils/nasa7EquationMethod.ts — new method class
export class Nasa7EquationMethod implements Equation<Nasa7Equation> {
  // Cp/R = a1 + a2T + a3T² + a4T³ + a5T⁴  →  Cp [J/(mol·K)]
  calculate(T: number, vars: Nasa7Equation, min: number, max: number, k = 1): number

  // Integral of Cp dT / (T2-T1) — average Cp over interval
  calculateAverage(T1: number, T2: number, vars: Nasa7Equation, min: number, max: number, k?: number): number

  // H(T)/R = a1T + a2T²/2 + a3T³/3 + a4T⁴/4 + a5T⁵/5 + a6
  enthalpy(T: number, vars: Nasa7Equation): number   // J/mol — extra method beyond Equation<T>

  // S(T)/R = a1·lnT + a2T + a3T²/2 + a4T³/3 + a5T⁴/4 + a7
  entropy(T: number, vars: Nasa7Equation): number    // J/(mol·K)

  // G = H - T·S
  gibbsEnergy(T: number, vars: Nasa7Equation): number // J/mol
}
```

`Common.equation(EquationTypeDto.nasa7)` returns a `Nasa7EquationMethod` instance — same dispatch
as all other equation types.

---

## How NASA-7 entries look in compound data

Example — adding NASA-7 to `CO2.ts`:

```typescript
heatCapacity: {
  def: 1,          // default stays quartic (ref.6) for recuperator energy balance
  values: [
    { type: EquationTypeDto.quartic, ref: 6, page: 51, vars: { a:27.437, ... }, min:50, max:5000 },
    { type: EquationTypeDto.cubic,   ref: 5, page: 911, vars: { a:22.26, ... }, min:273, max:1800 },
    { type: EquationTypeDto.linearHyperbolic, ref:1, ... },
    { type: EquationTypeDto.alyLee,  ref: 4, ... },
    { type: EquationTypeDto.nasa7,   ref: 8, page: 0,   // ref 8 = NASA TM-4513, McBride 1993
      vars: {
        low:  [2.35677352, 8.98459677e-3, -7.12356269e-6, 2.45919022e-9, -1.43699548e-13, -4.83719697e4, 9.90105222],
        high: [4.63659493, 2.74131991e-3, -9.95828542e-7, 1.60373011e-10, -9.16103468e-15, -4.90249392e4, -1.93489550],
        Tswitch: 1000,
      },
      min: 200, max: 6000,
    },
  ],
},
```

To use NASA-7 Cp: `FluidConditionCompound.heatCapacity(T)` with `def` pointing to the nasa7 entry.  
To use H, S, G: call `nasa7Method.enthalpy(T, vars)` / `entropy` / `gibbsEnergy` directly —
these are extra methods on `Nasa7EquationMethod` not part of the base `Equation<T>` interface.

---

## Consequence: no separate `Nasa7Service`

H/S/G are methods on `GasPropertiesService`. It finds the `nasa7` entry in the compound's
`heatCapacity.values[]` and calls `Nasa7EquationMethod`:

```typescript
@Injectable()
export class GasPropertiesService {
  // ...Cp methods...

  h(species: Species, T: number): number {
    const entry = gasCompounds[species].heatCapacity.values
      .find(v => v.type === EquationTypeDto.nasa7);
    return new Nasa7EquationMethod().enthalpy(T, entry.vars as Nasa7Equation);
  }

  s(species: Species, T: number): number { /* entropy */ }
  g(species: Species, T: number): number { /* h(T) - T * s(T) */ }
}
```

No separate service. No separate data store. One injectable for all thermophysical properties.

---

## Comparing approximations

Because all equations live in the same `values[]` array, comparison is trivial:

```typescript
// Compare all available Cp approximations at T=1000K for CO2:
CO2.heatCapacity.values.forEach((eq, i) => {
  const method = Common.equation(eq.type);
  const cp = method.calculate(1000, eq.vars, eq.min, eq.max, eq.k);
  console.log(`[${i}] ${eq.type} ref.${eq.ref}: Cp = ${cp} J/(mol·K)`);
});
```

A future `/thermodynamics/compare` endpoint can expose this directly.

---

## Which `def` index to use where

| Use case | Preferred equation | Reason |
|---|---|---|
| Recuperator energy balance (300–1800K) | quartic (ref.6) — current `def` | Validated in recuperator context |
| Combustion flame temperature | quartic or nasa7 — caller's choice | Both cover 1000–5000K; nasa7 more accurate above 2000K |
| Gibbs equilibrium, H/S/G | nasa7 only | Only equation type providing H, S, G |
| Cross-validation / comparison | all entries | Use `values[]` loop |

**Rule:** callers that need H/S/G must explicitly request the `nasa7` entry. Callers that need only Cp
use `FluidConditionCompound` with the compound's default `def` index — no change to existing code.

---

## NASA-7 coefficient quality action (same as before)

- [ ] Replace `furnaceCombustion/classes/Thermodynamics.js` "approximate, truncated" values with full-precision NASA TM-4513 coefficients
- [ ] Add NASA-7 entries to all 9 gas compounds (CO2, CO, H2, H2O, O2, N2, CH4, NH3, + C(graphite) if needed)
- [ ] Add NH3 NASA-7 coefficients (missing from all legacy sources)
- [ ] Unit test: `nasa7Method.calculate('CO2', 1000)` ≈ 37.11 J/(mol·K) (NIST WebBook)
- [ ] Unit test: H continuity across Tswitch=1000K (low-T and high-T sets must agree)
