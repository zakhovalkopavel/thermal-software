# Thermodynamics Module — Service Reference

**Base path:** `/api/v1/thermodynamics`, `/api/v1/numeric`  
**Last Updated:** May 2026  
**Status:** Implemented — tests partial (see [IMPLEMENTATION_STATUS.md](../migration/IMPLEMENTATION_STATUS.md))

For API input/output conventions (fluid interface, DTOs, Swagger rules) see
**[THERMODYNAMICS_API_SPEC.md](../api/THERMODYNAMICS_API_SPEC.md)**.  
This document covers the **actual computation** each service performs.

---

## Service Map

```
ThermodynamicsModule
├── FluidPropertyService          ← orchestration: resolves species/mixture, delegates maths
├── GasPropertiesService          ← Cp (NASA-7, Aly-Lee, polynomial), mixture Cp, enthalpy
├── TransportService              ← μ (Sutherland), λ (Eucken), ρ (ideal gas), ν
├── DimensionlessCalculationService ← orchestration: re/pr/gr/ra/Nu/HTC from flat fluid input
├── DimensionlessNumbersService   ← pure formulas: Re, Pr, Gr, Ra, Nu (correlations), HTC
├── RadiationService              ← gas emissivity (Hottel–Mikheev), radiation HTC
├── AerodynamicsService           ← drag coefficient, terminal velocity
├── DiffusionService              ← binary diffusion coefficient (Chapman-Enskog)
└── TransportService              ← combined viscosity + conductivity + density
```

---

## 1. GasPropertiesService

**File:** `services/gas-properties.service.ts`  
**Purpose:** Evaluate thermophysical properties of pure species and mixtures from
polynomial or NASA coefficient data stored in the compound registry.

### Public methods

#### `cpSpecies(species, T_K, T0_K?) → number`
Returns Cp [J/(mol·K)] for a pure species at temperature T_K using the compound's
default (`def`) equation. If T0_K is supplied, returns the mean Cp over [T0_K, T_K].

#### `cpSpeciesByIndex(species, equationIndex, T_K, T0_K?) → number`
As above, but selects a specific entry from `heatCapacity.values[]` by index —
used to compare different approximations.

#### `cpCompare(species, T_K) → CpComparisonEntryDto[]`
Returns Cp from **every** equation in `heatCapacity.values[]` for cross-checking.
Each entry reports `{ index, type, ref, value, rangeValid }`.

#### `cpMixture(composition: Record<Species, number>, T_K) → number`
Mole-fraction-weighted mean Cp [J/(mol·K)] for a gas mixture.  
`Σ xᵢ · Cpᵢ(T)` — mole fractions need not sum to exactly 1 (normalised internally).

#### `nasa7Properties(species, T_K) → GasPropertiesResultDto`
Evaluates all NASA-7 polynomial properties at T_K:
- `Cp_J_molK` — heat capacity at constant pressure
- `H_J_mol` — enthalpy (relative to 298.15 K)
- `S_J_molK` — entropy
- `G_J_mol` — Gibbs free energy

NASA-7 form (dimensionless, 7 coefficients per temperature range):
```
Cp/R = a1 + a2·T + a3·T² + a4·T³ + a5·T⁴
H/RT = a1 + a2T/2 + a3T²/3 + a4T³/4 + a5T⁴/5 + a6/T
S/R  = a1·ln(T) + a2·T + a3T²/2 + a4T³/3 + a5T⁴/4 + a7
```
Switch temperature (`Tswitch`) selects low/high coefficient set.

**Correlations in registry:** Aly-Lee (DIPPR-107), quartic polynomial (Yaws), NASA-7, NASA-9.

---

## 2. TransportService

**File:** `services/transport.service.ts`  
**Purpose:** Viscosity, thermal conductivity, and density of pure gases.

### Public methods

#### `viscosity(species, T_K) → number` [Pa·s]
Sutherland's formula:
```
μ = μ₀ · (T/T₀)^(3/2) · (T₀ + S) / (T + S)
```
Parameters `{μ₀, T₀, S}` come from `compound.sutherlandParams` (ref: White 2006, Appendix A).

#### `thermalConductivity(species, T_K) → number` [W/(m·K)]
Modified Eucken approximation:
```
λ = μ · (Cp + 5R/4·M⁻¹)    for monatomic: λ = 5/2 · μ · Cv/M
```

#### `density(M_kg_mol, T_K, P_Pa?) → number` [kg/m³]
Ideal gas law: `ρ = P·M / (R·T)`.  Default P = 101 325 Pa.

#### `kinematicViscosity(species, T_K, P_Pa?) → number` [m²/s]
`ν = μ/ρ`

---

## 3. FluidPropertyService

**File:** `services/fluid-property.service.ts`  
**Purpose:** Orchestration layer for `/thermodynamics/fluid/*` endpoints.
Resolves "fluid" (named species or mixture) and delegates to `GasPropertiesService`
+ `TransportService`.

Supports three fluid modes:
- **Named species** — e.g. `fluid: "N2"` → looks up `GAS_REGISTRY[species]`
- **Air alias** — `fluid: "air"` → computed from `AIR_MOLE_COMPOSITION` mixture
- **Gas mixture** — `composition: { N2: 0.79, O2: 0.21 }` → mixture rules

### Public methods

#### `getCp(dto) → FluidCpResultDto`
Returns `{ Cp_J_kgK, Cv_J_kgK, gamma, molecularWeight_kg_mol, species, T_K }`.

#### `getViscosity(dto) → FluidViscosityResultDto`
Returns `{ mu_Pa_s, nu_m2s, species, T_K }`.

#### `getDensity(dto) → FluidDensityResultDto`
Returns `{ rho_kg_m3, T_K, P_Pa }`.

#### `getThermalConductivity(dto) → FluidThermalConductivityResultDto`
Returns `{ lambda_W_mK, species, T_K }`.

#### `getFluidList() → FluidListEntry[]`
Lists all available named fluids from `GAS_REGISTRY` with molecular weights.

#### `getGeometryList() → GeometryListEntry[]`
Lists all available `geometry` keys with required `dimensions` subfields.
**Canonical reference** for which dimension fields each geometry requires — do not
duplicate this mapping in DTOs.

#### `getCorrelationList() → CorrelationListEntry[]`
Lists all Nusselt correlations with validity ranges.  
Re/Pr ranges serialised as `[min, "Infinity"]` when unbounded (never `null`).

#### `getFlowModeList() → FlowModeEntry[]`
Lists forced/natural/mixed convection modes.

---

## 4. DimensionlessNumbersService

**File:** `services/dimensionless-numbers.service.ts`  
**Purpose:** Pure mathematical formulas for dimensionless numbers and Nusselt correlations.
No fluid resolution — accepts pre-resolved transport properties.

### Scalar dimensionless numbers

| Method | Formula |
|--------|---------|
| `reynolds(ρ, w, L, μ)` | Re = ρ·w·L / μ |
| `reynoldsKinematic(w, L, ν)` | Re = w·L / ν |
| `prandtl(μ, Cp, λ)` | Pr = μ·Cp / λ |
| `grashof(T_hot, T_cold, L, ν, g?)` | Gr = g·β·ΔT·L³ / ν²; β = 2/(T_hot+T_cold) |
| `rayleigh(T_hot, T_cold, L, ν, Pr, g?)` | Ra = Gr · Pr |
| `htc(Nu, λ, L)` | h = Nu·λ / L  [W/(m²·K)] |

All `g` parameters default to `Common.g = 9.80665 m/s²`; supply override for non-Earth conditions.

### Nusselt number correlations

`nusselt(dto, props) → NusseltResult`

Selects correlation based on `geometry` + flow regime (forced forced/natural/mixed):

| Geometry key | Regime | Correlation |
|---|---|---|
| `pipe_forced` | forced, Re < 2300 | Sieder-Tate (laminar) |
| `pipe_forced` | forced, Re > 10 000 | Dittus-Boelter (turbulent) |
| `pipe_natural` | natural | Churchill-Chu |
| `flat_plate_forced` | forced | Average flat-plate correlation |
| `sphere_forced` | forced | Whitaker sphere correlation |
| `cylinder_forced` | forced | Churchill-Bernstein |
| `annulus_forced` | forced | Dittus-Boelter with hydraulic diameter |

Returns `{ Nu, correlation, flowRegime, Re?, Pr?, Gr?, Ra?, validityWarnings[] }`.

### Characteristic length

`characteristicLength(geometry, dimensions) → number`  
Maps geometry key to the correct dimension from `GeometryDimsDto`
(e.g. pipe → `a` = inner diameter; sphere → `a` = diameter).

---

## 5. DimensionlessCalculationService

**File:** `services/dimensionless-calculation.service.ts`  
**Purpose:** Orchestration layer for `/thermodynamics/dimensionless/*` endpoints.
Resolves fluid properties from the flat fluid interface, then delegates to
`DimensionlessNumbersService`.

Implements **Mode B** fluid resolution: given `{fluid, T_fluid_K, P_Pa}`, calls
`GasPropertiesService + TransportService` to obtain `{ρ, μ, Cp, λ, ν}` before
passing them to the pure-math service.

### Public methods

| Method | Endpoint |
|--------|---------|
| `reynolds(dto)` | `POST /thermodynamics/dimensionless/reynolds` |
| `prandtl(dto)` | `POST /thermodynamics/dimensionless/prandtl` |
| `grashof(dto)` | `POST /thermodynamics/dimensionless/grashof` |
| `rayleigh(dto)` | `POST /thermodynamics/dimensionless/rayleigh` |
| `nusselt(dto)` | `POST /thermodynamics/dimensionless/nusselt` |
| `htc(dto)` | `POST /thermodynamics/dimensionless/htc` — Nu computed internally |

---

## 6. RadiationService

**File:** `services/radiation.service.ts`  
**Purpose:** Radiation heat transfer for participating gas mixtures (CO₂ + H₂O)
and surface-to-surface radiation.

### Public methods

#### `gasEmissivity(pH2O, pCO2, L, T_K) → number`
Effective emissivity of a CO₂/H₂O gas mixture — **Hottel–Mikheev** correlation:
```
pSum = pCO₂ + pH₂O
k    = (0.78 + 1.6·pH₂O − 0.1·pSum^(L/2)) · (1 − 0.37·T/1000)
ε    = 1 − exp(−k · √(pSum · L))
```
Partial pressures in [atm], mean beam length L in [m].  
Source: [21] Mikheev 1977; ported from legacy `recuperator.js` lines 1120–1145.

#### `gasRadiationHtc(pH2O, pCO2, L, T_gas_K, T_wall_K) → number`
Radiation heat transfer coefficient `α_rad` [W/(m²·K)]:
```
α_rad = ε · σ · (T_gas⁴ − T_wall⁴) / (T_gas − T_wall)
```
Returns 0 when |T_gas − T_wall| < 0.01 K.

#### `surfaceRadiation(T_hot_K, T_cold_K, emissivity, area?) → number`
Stefan-Boltzmann surface radiation: `q = ε · σ · (T_hot⁴ − T_cold⁴)`.

#### `linearisedRadiationCoefficient(T_hot_K, T_cold_K, emissivity) → number`
Linearised form for combined convection-radiation: `α_lin = ε·σ·(T_h²+T_c²)·(T_h+T_c)`.

---

## 7. DiffusionService

**File:** `services/diffusion.service.ts`  
**Purpose:** Binary mass diffusion coefficient for gas pairs.

#### `binaryDiffusivity(speciesA, speciesB, T_K, P_Pa?) → number` [m²/s]
Chapman-Enskog equation:
```
D_AB = 1.858e-3 · T^(3/2) · √(1/M_A + 1/M_B)
       / (P · σ_AB² · Ω_D(T*))
```
where `σ_AB = (σ_A + σ_B)/2`, `ε_AB/k = √(ε_A/k · ε_B/k)`,
`T* = kT/ε_AB`, and `Ω_D` is the collision integral (Neufeld 1972 fit).  
Lennard-Jones parameters from compound data (`collisionDiameter`, `epsilonToKb`).

---

## 8. AerodynamicsService

**File:** `services/aerodynamics.service.ts` (40 lines — thin, likely incomplete)

#### `dragCoefficient(Re) → number`
Sphere drag coefficient from Re:
- Stokes: Re < 1 → `Cd = 24/Re`
- Intermediate: 1–1000 → `Cd = 24/Re + 6/(1+√Re) + 0.4`
- Newton: Re > 1000 → `Cd ≈ 0.44`

#### `terminalVelocity(d, rho_particle, rho_fluid, mu) → number` [m/s]
Iterative solution for settling velocity in fluid.

> ⚠️ Implementation is thin (40 lines). Review before relying on complex cases.

---

## Numeric Endpoints (`/api/v1/numeric`)

Controller: `numeric.controller.ts`  
DTOs: `backend/src/modules/thermodynamics/dto/` — all exported from `dto/index.ts`  
Response formatting: `backend/src/common/utils/numeric-format.util.ts`

| Endpoint | Method / Algorithm | Response shape |
|---|---|---|
| `POST /numeric/brentq` | Brent bracketed root-finding | `{ root, iterations, converged }` |
| `POST /numeric/nelder-mead` | Nelder-Mead simplex (named variables) | `{ variables: {x1, x2, …}, fval }` |
| `POST /numeric/regression/linear` | Least squares | `{ slope, intercept, r2, formula }` |
| `POST /numeric/regression/polynomial` | Polynomial (degree n) | `{ coefficients: {c0…cn}, r2, formula }` |
| `POST /numeric/regression/exponential` | `y = A·e^(B·x)` | `{ A, B, r2, formula }` |
| `POST /numeric/regression/power` | `y = A·x^B` | `{ A, B, r2, formula }` |
| `POST /numeric/regression/levenberg-marquardt` | Non-linear LM | `{ parameterValues, parameterError, iterations, formula }` |

**Nelder-Mead variable naming:** uses named-variable object (`{ x1: 0, x2: 0 }`) — not index arrays.  
**Polynomial coefficients:** ascending order (`c0` = constant, `c1` = linear, …).  
**Formula strings:** always built by helpers in `numeric-format.util.ts` — never constructed inline.

See [THERMODYNAMICS_API_SPEC.md 8](../api/THERMODYNAMICS_API_SPEC.md) for full DTO format.

