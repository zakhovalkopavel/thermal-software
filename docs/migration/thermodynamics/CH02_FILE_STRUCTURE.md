# CH02 — File Structure

## Target layout — `backend/src/modules/thermodynamics/`

```
backend/src/modules/thermodynamics/
├── thermodynamics.module.ts
├── controllers/
│   └── thermodynamics.controller.ts
│       # POST /thermodynamics/dimensionless  — Re/Pr/Gr/Ra/Nu/h
│       # POST /thermodynamics/body-geometry  — area/volume/meanBeamLength
│       # GET  /thermodynamics/compare        — Cp comparison (dev)
├── services/
│   ├── gas-properties.service.ts         # Cp/H/S/G, cpCompare, mixture facade
│   ├── transport.service.ts              # Sutherland μ + Wilke mixing + Eucken λ
│   ├── diffusion.service.ts              # Chapman-Enskog D_ij
│   ├── dimensionless-numbers.service.ts  # Re/Pr/Nu/Gr/Ra + body geometry — see CH07
│   └── aerodynamics.service.ts           # Ergun pressure drop, superficial velocity
├── enums/
│   ├── flow-geometry.enum.ts             # PIPE_CIRCULAR, DUCT_*, FLAT_PLATE, PACKED_BED, … (see CH07)
│   └── body-geometry.enum.ts             # SPHERE, CYLINDER, CUBE, CONE, TRUNCATED_CONE, … (see CH07)
├── interfaces/
│   └── geometry-dims.interface.ts        # { a, b, c, L, epsilon, S_T, S_L, angle_deg }
└── dto/
    ├── gas-mixture-input.dto.ts
    ├── gas-properties-result.dto.ts
    ├── cp-comparison-result.dto.ts
    ├── dimensionless-input.dto.ts
    ├── dimensionless-result.dto.ts
    ├── body-geometry-input.dto.ts
    ├── body-geometry-result.dto.ts
    └── species.enum.ts
```

---

## `common/thermal` — **IMPLEMENTED** ✅

The shared library is fully operational. All items below are complete.

```
backend/src/common/thermal/
├── index.ts                              ← barrel: re-exports dto, interfaces, utils, compound, type
├── dto/
│   ├── equation-type.dto.ts              ← enum EquationTypeDto (linear … nasa7)
│   ├── ref-key.dto.ts                    ← REFERENCES_META: Record<RefKey, {index, name, year, url?}>
│   └── index.ts
├── enum/
│   └── ref-key.enum.ts                   ← enum RefKey — 20 entries (Szargut … White3)
├── interfaces/
│   ├── equation.interface.ts             ← interface Equation<T> { calculate, calculateAverage, integral }
│   ├── equation-value.interface.ts       ← interface EquationValue { type, ref: RefKey, page?, vars, min, max, k? }
│   ├── compound-value.interface.ts       ← interface CompoundValue (name, Mr, nasa7?, heatCapacity, viscosity, thermalConductivity, …)
│   └── index.ts
├── type/
│   ├── linear-equation.ts                ← type LinearEquation { a, b }
│   ├── quadratic-equation.ts             ← type QuadraticEquation { a, b, c }
│   ├── cubic-equation.ts                 ← type CubicEquation { a, b, c, d }
│   ├── quartic-equation.ts               ← type QuarticEquation { a, b, c, d, e }
│   ├── linear-hyperbolic-equation.ts     ← type LinearHyperbolicEquation { a, b, d }
│   ├── linear-hyperbolic-logarithmic-equation.ts ← type LinearHyperbolicLogarithmicEquation { c1, c2, c3, c4 }
│   ├── aly-lee-equation.ts               ← type AlyLeeEquation { c1, c2, c3, c4, c5 }
│   ├── dippr-n102-equation.ts            ← type DipprN102Equation { c1, c2, c3, c4 }
│   ├── nasa7-equation.ts                 ← type Nasa7Coeffs { a1…a7 }; type Nasa7Equation { low, high, Tswitch }
│   └── index.ts
├── utils/
│   ├── common.ts                         ← class Common { kB, R, Na, g, validInterval, equation() dispatch }
│   ├── linear-equation-method.ts         ← class LinearEquationMethod
│   ├── quadratic-equation-method.ts      ← class QuadraticEquationMethod
│   ├── cubic-equation-method.ts          ← class CubicEquationMethod
│   ├── quartic-equation-method.ts        ← class QuarticEquationMethod
│   ├── linear-hyperbolic-equation-method.ts
│   ├── linear-hyperbolic-logarithmic-equation-method.ts
│   ├── aly-lee-equation-method.ts        ← exact antiderivative (WolframAlpha verified)
│   ├── dippr-equation-102-method.ts      ← Gauss–Legendre 20-pt (no closed form)
│   ├── nasa7-equation-method.ts          ← implements Equation<Nasa7Equation> + enthalpy/entropy/gibbsEnergy
│   ├── compound-property-resolver.ts     ← class CompoundPropertyResolver; type PreferredApprox
│   └── index.ts
└── compound/
    ├── index.ts
    └── gas/
        ├── n2.ts, o2.ts, co2.ts, co.ts, h2o.ts, h2.ts, ch4.ts, nh3.ts
        ├── air.ts, no.ts, no2.ts, so2.ts, so3.ts
        └── registry.ts                  ← GAS_REGISTRY: Record<string, CompoundValue>
```

### Key design decisions (already enforced)

| Rule | Detail |
|------|--------|
| SRP | Each file exports exactly one `type`, `interface`, or `class` |
| Types vs interfaces | `type` for coefficient shapes; `interface` for behavioural contracts |
| `nasa7` position | Top-level `CompoundValue.nasa7?` field — **not** inside `heatCapacity.values[]` |
| `nasa7` coefficients | Named fields `{a1…a7}` — **not** tuple arrays |
| `RefKey` | All `EquationValue.ref` fields use `RefKey` enum — never raw numbers |
| `ref-key.enum.ts` | Lives in `enum/` — separate from `dto/ref-key.dto.ts` (REFERENCES_META) |
| Exact integrals | Used for all equation types except `dipprN102` |
| Numerical integration | `gaussLegendre20` from `common/utils/gauss-legendre.util.ts` — re-exported via `numeric.util.ts` |
| Property resolution | Always through `CompoundPropertyResolver` — never direct equation calls from services |

---

## `common/utils` — numerical helpers (IMPLEMENTED ✅)

```
backend/src/common/utils/
├── gauss-legendre.util.ts    ← GL20_NODES, GL20_WEIGHTS, gaussLegendre20()
│                               (SRP: only quadrature; coefficients from Abramowitz & Stegun Table 25.4)
└── numeric.util.ts           ← brentq, brent, nelderMead, conjugateGradient, linearRegression,
                                polynomialFit, exponentialFit, powerFit, levenbergMarquardt, luSolve
                                re-exports { gaussLegendre20, GL20_NODES, GL20_WEIGHTS }
```

---

## Relationship to `common/thermal` (services consume, not re-implement)

```
ThermodynamicsModule
  GasPropertiesService
    └── GAS_REGISTRY           (from common/thermal/compound/gas/registry.ts)
    └── CompoundPropertyResolver (from common/thermal/utils/)
    └── Nasa7EquationMethod    (from common/thermal/utils/ — for enthalpy/entropy/gibbs)
  TransportService
    └── compound.sutherlandParams (from CompoundValue.sutherlandParams)
    └── Wilke mixing — own implementation (not in common/thermal)
  DiffusionService
    └── compound.collisionDiameter / epsilonToKb (from CompoundValue)
    └── Chapman-Enskog — own implementation
  DimensionlessNumbersService
    └── stateless — all inputs are pre-computed scalars
```

