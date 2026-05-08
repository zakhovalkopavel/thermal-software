# Common Thermal Library — Reference

**Path:** `backend/src/common/thermal/`  
**Last Updated:** May 2026  
**Purpose:** Shared, framework-agnostic thermophysical data and utilities used by
the thermodynamics module and any future modules that need gas-phase property data.

---

## Structure

```
backend/src/common/thermal/
├── index.ts                    ← barrel export
├── compound/
│   ├── gas/                    ← 16 pure-species CompoundValue objects
│   │   ├── air.ts, ar.ts, ch4.ts, co.ts, co2.ts, h2.ts, h2o.ts
│   │   ├── n2.ts, nh3.ts, no.ts, no2.ts, o2.ts, so2.ts, so3.ts
│   │   ├── registry.ts         ← GAS_REGISTRY: Record<Species, CompoundValue>
│   │   └── index.ts
│   └── composition/
│       ├── air.composition.ts  ← AIR_MOLE_COMPOSITION (dry air mole fractions)
│       └── index.ts
├── interfaces/
│   ├── compound-value.interface.ts   ← CompoundValue (core data shape)
│   └── equation-value.interface.ts  ← EquationValue (one correlation entry)
├── type/                       ← coefficient type aliases (one per file)
│   ├── nasa7-equation.ts
│   ├── nasa9-equation.ts
│   ├── aly-lee-equation.ts
│   ├── quartic-equation.ts
│   └── …
├── enum/
│   └── ref-key.enum.ts         ← RefKey enum — all literature keys
├── dto/
│   ├── equation-type.dto.ts    ← EquationTypeDto enum
│   └── ref-key.dto.ts          ← (legacy path, kept for compat)
└── utils/
    ├── common.ts               ← Common constants (R, g, σ, pAtm, …)
    ├── compound-property-resolver.ts  ← CompoundPropertyResolver
    ├── nasa7-equation-method.ts
    ├── gauss-legendre.util.ts
    ├── numeric-format.util.ts
    └── numeric.util.ts
```

---

## Gas Compound Registry (`GAS_REGISTRY`)

**File:** `compound/gas/registry.ts`  
**Type:** `Record<Species, CompoundValue>`

Sixteen pure-species compounds, keyed by the `Species` enum from the thermodynamics module:

| Key | Name | Mr [kg/mol] | Data sources |
|-----|------|-------------|--------------|
| `N2` | Nitrogen | 0.028014 | NASA-7 (GRI-Mech), Yaws quartic Cp, Sutherland μ (White 2006) |
| `O2` | Oxygen | 0.031999 | NASA-7, Yaws quartic Cp, Sutherland μ |
| `CO2` | Carbon dioxide | 0.044010 | NASA-7, Aly-Lee Cp (Perry 7th ed.) |
| `H2O` | Water vapour | 0.018015 | NASA-7, polynomial Cp |
| `CO` | Carbon monoxide | 0.028010 | NASA-7, polynomial Cp |
| `H2` | Hydrogen | 0.002016 | NASA-7, polynomial Cp |
| `CH4` | Methane | 0.016043 | NASA-7, Aly-Lee Cp |
| `NH3` | Ammonia | 0.017031 | Polynomial Cp |
| `NO` | Nitric oxide | 0.030006 | NASA-7 |
| `NO2` | Nitrogen dioxide | 0.046006 | Polynomial Cp |
| `SO2` | Sulphur dioxide | 0.064065 | Polynomial Cp |
| `SO3` | Sulphur trioxide | 0.080064 | Polynomial Cp |
| `AR` | Argon | 0.039948 | Monatomic: Cp = 5R/2M; Sutherland μ |
| `air` | Dry air (alias) | 0.028951 | Mixture over `AIR_MOLE_COMPOSITION` |

Each compound object (`CompoundValue`) carries:
- `Mr` — molar mass [kg/mol]
- `enthalpyFormation298`, `gibbsEnergy298` — formation data [J/mol]
- `collisionDiameter` [Å], `epsilonToKb` [K] — Lennard-Jones parameters for Chapman-Enskog
- `sutherlandParams: { mu0, T0, S }` — Sutherland viscosity parameters
- `nasa7: { Tswitch, low: {a1…a7}, high: {a1…a7} }` — NASA-7 coefficients
- `nasa9?: { ranges: [{Tmin, Tmax, coeffs: {a1…a9}}] }` — NASA-9 (preferred when available)
- `heatCapacity: { def, values: EquationValue[] }` — polynomial Cp correlations

---

## CompoundValue Interface

**File:** `interfaces/compound-value.interface.ts`

```typescript
export interface CompoundValue {
  name: string;
  chemicalFormula: string;
  Mr: number;                           // kg/mol
  enthalpyFormation298: number;         // J/mol
  gibbsEnergy298: number;               // J/mol
  collisionDiameter: number;            // Å (Lennard-Jones σ)
  epsilonToKb: number;                  // K  (Lennard-Jones ε/k)
  sutherlandParams?: { mu0: number; T0: number; S: number };
  nasa7?: {
    Tswitch: number;
    low:  { a1: number; a2: number; a3: number; a4: number; a5: number; a6: number; a7: number };
    high: { a1: number; a2: number; a3: number; a4: number; a5: number; a6: number; a7: number };
  };
  nasa9?: {
    ranges: Array<{
      Tmin: number;
      Tmax: number;
      coeffs: { a1: number; a2: number; a3: number; a4: number; a5: number;
                a6: number; a7: number; a8: number; a9: number };
    }>;
  };
  heatCapacity: {
    def: number;                        // index of default equation
    values: EquationValue[];
  };
}
```

---

## EquationValue Interface

**File:** `interfaces/equation-value.interface.ts`

One correlation entry inside `heatCapacity.values[]`:

```typescript
export interface EquationValue {
  type: EquationTypeDto;        // equation family (see below)
  ref: RefKey;                  // literature key — never a raw number
  page?: number;                // page in the reference
  vars: object;                 // coefficient shape depends on `type`
  min: number;                  // valid range lower bound [K]
  max: number;                  // valid range upper bound [K]
}
```

### Supported equation types (`EquationTypeDto`)

| Type | Formula | Coefficient shape |
|------|---------|-------------------|
| `linear` | a + b·T | `{ a, b }` |
| `quadratic` | a + b·T + c·T² | `{ a, b, c }` |
| `cubic` | + d·T³ | `{ a, b, c, d }` |
| `quartic` | + e·T⁴ | `{ a, b, c, d, e }` |
| `linearHyperbolic` | a + b·T + c/T² | `{ a, b, c }` |
| `alyLee` | DIPPR-107: c1 + c2·[c3/T / sinh(c3/T)]² + c4·[c5/T / cosh(c5/T)]² | `{ c1, c2, c3, c4, c5 }` |
| `dipprN102` | c1·T^c2 / (1 + c3/T + c4/T²) | `{ c1, c2, c3, c4 }` |
| `nasa7` | 7-coefficient polynomial (Cp, H, S, G) | — stored in `CompoundValue.nasa7`, not here |
| `nasa9` | 9-coefficient (variable ranges) | — stored in `CompoundValue.nasa9`, not here |

> `nasa7`/`nasa9` are **top-level fields** on `CompoundValue`, not `heatCapacity.values[]` entries.
> See [CONVENTIONS.md §6](../CONVENTIONS.md) for the rule.

---

## CompoundPropertyResolver

**File:** `utils/compound-property-resolver.ts`  
**Usage:** All property evaluations **must** go through this class — never call equation-method
classes directly from business logic (see [CONVENTIONS.md §7](../CONVENTIONS.md)).

```typescript
const resolver = new CompoundPropertyResolver(N2);

// Cp [J/(mol·K)] — uses default equation (def index), or nasa9/nasa7 if present
const cp = resolver.heatCapacity(1000);

// Select by RefKey or by index
const cp = resolver.heatCapacity(1000, RefKey.Yaws1999);
const cp = resolver.heatCapacity(1000, 0);

// Enthalpy, entropy, Gibbs from NASA-9 (preferred) or NASA-7
const h = resolver.enthalpy(1000);     // J/mol
const s = resolver.entropy(1000);      // J/(mol·K)
const g = resolver.gibbsEnergy(1000);  // J/mol
```

Resolution priority for `heatCapacity`: nasa9 > nasa7 > `def` index polynomial.

---

## Common Constants (`utils/common.ts`)

```typescript
Common.R         = 8.31446   // Universal gas constant [J/(mol·K)]
Common.g         = 9.80665   // Standard gravity [m/s²]
Common.sigma     = 5.6704e-8 // Stefan-Boltzmann constant [W/(m²·K⁴)]
Common.pAtm      = 101_325   // Standard atmospheric pressure [Pa]
Common.Tstandart = 298.15    // Standard temperature [K]
```

---

## Numeric Utilities

### `gauss-legendre.util.ts`
Gauss-Legendre quadrature for numerical integration.  
Used only when no closed-form antiderivative exists (e.g., `dipprN102` with non-integer
exponent — see [CONVENTIONS.md §4](../CONVENTIONS.md)).

### `numeric.util.ts`
Internal wrappers for Brent root-finding (`brentq`) and Nelder-Mead optimisation.  
**Never import these directly in business logic** — use the `/api/v1/numeric` endpoints
or the approved service-layer wrappers (see [NUMERICAL_METHODS_CONVENTION.md](../NUMERICAL_METHODS_CONVENTION.md)).

### `numeric-format.util.ts`
Formula-string builders for regression responses.  
All `/numeric/regression/*` endpoints must use these helpers — never construct formula
strings inline in a controller.

---

## Air Composition (`compound/composition/air.composition.ts`)

`AIR_MOLE_COMPOSITION` — dry air mole fractions used by the `"air"` fluid alias:

```typescript
{ N2: 0.7809, O2: 0.2095, AR: 0.0093, CO2: 0.0003 }
```

---

## RefKey Enum (`enum/ref-key.enum.ts`)

Every coefficient set that originates from a literature source **must** reference a `RefKey`
value. Never use raw integers as reference identifiers.

See [REFERENCES.md](../REFERENCES.md) for the full bibliography (author, year, ISBN/URL)
keyed by `RefKey`.

---

## Adding a New Gas Compound

1. Create `compound/gas/<formula>.ts` exporting one `const` of type `CompoundValue`.
2. Add `nasa7` or `nasa9` block (preferred) plus at least one `heatCapacity.values[]` entry.
3. Every `EquationValue` must have `ref: RefKey.Xxx` pointing to `docs/REFERENCES.md`.
4. Add the compound to `compound/gas/registry.ts` under the matching `Species` key.
5. Add a `Species` enum entry if it doesn't exist yet.
6. Write a test in `backend/test/unit/thermal/compound/` verifying Cp at a known T.
7. Update `docs/services/COMMON_THERMAL_LIBRARY.md` (this file) — add a row to the registry table.
8. Update `docs/migration/IMPLEMENTATION_STATUS.md`.

