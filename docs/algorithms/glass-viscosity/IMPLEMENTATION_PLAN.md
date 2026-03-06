# Glass Viscosity — Implementation Plan

**Date:** 2026-03-06  
**Status:** ACTIVE — refactored to split-file architecture  
**Supersedes:** The fake/wrong models in `viscosity-parameters.ts` and `glass-viscosity.service.ts`

---

## File Architecture

The service is split into focused files with single responsibilities:

```
backend/src/modules/refractory/
│
├── services/
│   └── glass-viscosity.service.ts          ← NestJS @Injectable orchestrator only
│                                              Model selection + result assembly
│                                              Delegates ALL calculations to utils
│
├── utils/
│   ├── glass-composition.util.ts           ← Pure composition functions (no NestJS)
│   │     normalizeComposition()            ← scale wt% to sum 100
│   │     wtPctToMolPct()                   ← wt% → mol% (full denominator)
│   │     molPctToWtPct()                   ← mol% → wt% (inverse)
│   │
│   └── glass-viscosity-models.util.ts      ← Pure model calculations (no NestJS)
│         predictIsokomsLakatos()           ← Lakatos 1976 isokom regression
│         predictIsokomsFluegel()           ← Fluegel 2007 isokom regression
│         calcHetheringtonLogEta()          ← Hetherington 1964 Arrhenius
│         hetheringtonTemperatureAtLogEta() ← Hetherington inverse
│         fitVtfThreePoints()              ← Analytical 3-point VTF fit
│         evalVtf()                         ← Forward VTF
│         temperatureAtLogViscosity()       ← Inverse VTF
│         calculateFixedPointsFromVtf()     ← All ASTM C965-96 fixed points
│
├── data/
│   ├── glass-viscosity-validation.data.ts  ← Reference glass dataset (test data)
│   └── interfaces/
│       └── glass-viscosity-validation.interface.ts  ← GlassIsokomPoint, GlassValidationEntry
│
├── interfaces/
│   ├── glass-viscosity.interface.ts        ← Service result shapes
│   └── viscosity-parameters.interface.ts   ← VtfPoint, VtfParameters, isokoms, ModelSelectionResult
│
├── constants/
│   └── viscosity-parameters.ts             ← LAKATOS_1976_COEFFICIENTS, FLUEGEL_2007_*, HETHERINGTON_1964, MOLAR_MASSES
│
└── enums/
    └── viscosity-model.enum.ts             ← ViscosityModel, ViscosityModelType, ConfidenceLevel
```

### Design rules

1. **`glass-viscosity.service.ts`** — NestJS concerns only: DI, routing, result assembly.  
   No raw arithmetic, no regression formulas, no mol% conversions.

2. **`utils/glass-composition.util.ts`** — composition math only, no model logic.  
   Exports plain functions, zero NestJS imports (except `BadRequestException` for guards).

3. **`utils/glass-viscosity-models.util.ts`** — model math only, no composition logic beyond  
   calling `wtPctToMolPct`. Exports plain functions, zero NestJS imports.

4. **`data/interfaces/`** — all data-layer interface types.  
   Test/validation dataset interfaces must not live in `.data.ts` files.

5. **Public delegates** — the service exposes thin wrapper methods (`predictIsokomsLakatos`,  
   `fitVtfThreePoints`, etc.) so tests can call them via the injected service instance  
   without importing utils directly.

---

This plan is informed by:
- [VISCOSITY_PARAMETERS_AUDIT.md](./VISCOSITY_PARAMETERS_AUDIT.md) — every model in
  `viscosity-parameters.ts` is wrong (wrong parameters, wrong architecture, or wrong formula convention)
- [COVERAGE_GAP_ANALYSIS.md](./COVERAGE_GAP_ANALYSIS.md) — Lakatos 1976 and Fluegel 2007 together
  cover the full composition space that v1 claimed to handle, except for true gaps
- [glass-viscosity-v2/](../glass-viscosity-v2/) — full algorithm spec for the correct implementation

---

## Models to Remove (Fake / Wrong)

The following eight models from `VISCOSITY_PARAMETERS` **must be removed** because they
are either fabricated, architecturally unsound, or use the wrong formula convention:

| Enum key | Problem summary | Audit finding |
|----------|----------------|---------------|
| `SODA_LIME_SILICA` | Component-effect-on-B architecture has no published basis; B=13 250 K produces softening at 1399°C | ❌ FAKE ARCHITECTURE |
| `BOROSILICATE` | NIST SRM 717a certified params are valid only for that one composition; adding component effects on B completely breaks them | ❌ MISAPPLIED |
| `ALUMINOSILICATE` | A=−4.5, B=19 000, T₀=350 match no publication; Giordano 2008 is a 10-oxide regression not three numbers | ❌ FABRICATED |
| `LEAD_GLASS` | Parameters are in log₁₀ Arrhenius convention but code evaluates ln(η); off by factor ln(10)≈2.303 | ❌ WRONG CONVENTION |
| `PURE_SILICA` | B=13 500 K is off by factor ~2; correct value is 25 000–31 000 K per Hetherington 1964 | ❌ WRONG B VALUE |
| `SODIUM_SILICATE` | T₀=225 K is unphysically low; model diverges at T<800°C; softening error +165°C | ❌ WRONG T₀/B |
| `SLAG_CAO_AL2O3` | Wrong Arrhenius convention (same as LEAD_GLASS) + wrong model (Urbain/Riboud required) | ❌ WRONG MODEL + CONVENTION |
| `FLUORIDE_GLASS` | T₀=150 K too low; no reliable published regression for pure fluoride glass | ❌ WRONG T₀ |
| `MULTI_COMPONENT_MIXING` | Softening point 1413°C — no real glass softens there; useless as fallback | ❌ UNREASONABLE |

**Also remove:** `calculateBParameter()` method from the service — the component-effect-on-B
architecture is physically wrong and has no published basis for any model.

---

## Models to Implement (Valid, Published)

### Priority 1: Lakatos 1976 — implement first

**What it is:** Multiple linear regression predicting isokom temperatures at three
viscosity levels as a function of glass composition expressed in parts-per-100-SiO₂ weight.

**Source data:** `shared/sources/lakatos_ocr/page_001_table_007.csv` (isokom coefficients)

**Algorithm (from `glass-viscosity-v2/chapter-04-lakatos-1976.md`):**
1. Convert composition from wt% to parts-per-100-SiO₂ (divide each component wt% by SiO₂ wt%, multiply by 100)
2. Apply linear regression formula (with quadratic B₂O₃ term) to predict T at log η = 2, 4, 6 poise
3. Convert isokom labels to Pa·s (subtract 1 from the poise exponent)
4. Fit three-point analytical VTF to the three (T, log η) pairs
5. Use VTF to evaluate any desired fixed point or arbitrary temperature

**Coverage:** SiO₂ 60–77 wt%, Na₂O 10–17 wt% always present, 11 components total.
All soda-lime and near-soda-lime compositions.

**Accuracy:** σ = 3–5°C on isokom temperatures.

**Note on VFT form:** The spec `glass-viscosity-v2/chapter-07-vtf-fitting.md` uses
`log₁₀(η [Pa·s]) = A + B / (T [°C] − T₀)` with T in Celsius, not Kelvin. The three-point
analytical solve produces T₀ in °C directly.

### Priority 2: Fluegel 2007 — implement second

**What it is:** Polynomial regression (linear + quadratic + cubic + cross-product terms)
predicting isokom temperatures at log η = 1.5, 6.6, 12.0 Pa·s. Calibrated on >2200
composition-viscosity measurements from SciGlass database. Compositions in mol% excluding SiO₂.

**Source data:**
- `shared/sources/fluegel_2007/Fluegel_table4.csv` — log η 1.5 Pa·s coefficients
- `shared/sources/fluegel_2007/Fluegel_table5.csv` — log η 6.6 Pa·s coefficients
- `shared/sources/fluegel_2007/Fluegel_table6.csv` — log η 12.0 Pa·s coefficients
- `shared/sources/fluegel_2007/Fluegel_table3.csv` — per-component validity bounds

**Algorithm (from `glass-viscosity-v2/chapter-05-fluegel-2007.md`):**
1. Convert composition from wt% to mol% (full moles denominator including SiO₂)
2. Set C_SiO₂ = 0 (SiO₂ is the reference component, not a regression variable)
3. Evaluate all polynomial terms from the three coefficient tables
4. Three resulting (T, log η) pairs → three-point analytical VTF fit
5. Use VTF for fixed points

**Coverage:** Broad silicate glass database. SiO₂ 43–89 mol%. ~56 components including
B₂O₃, PbO, fluorine, etc.

**Accuracy:** SE = 9–17°C per isokom level.

### Priority 3: Hetherington 1964 — pure fused silica only

**What it is:** Two-parameter Arrhenius fit from direct measurements of vitreous silica.

**Formula:** `log₁₀(η [Pa·s]) = −3.905 + 31400/T` where T is in Kelvin

**Coverage:** SiO₂ > 99 wt%, T = 1100–2300°C.

**No composition dependence** — single fixed equation. No VTF fitting needed.

---

## Models NOT to Implement (Real Gaps with No Simple Fix)

| System | Reason |
|--------|--------|
| Calcium-aluminate slag | Not a glass — Urbain/Riboud model requires a completely separate service pipeline (no VTF, no glass fixed points) |
| Fluoride glass (ZBLAN-type) | No reliable published regression; return `NOT_SUPPORTED` error code |
| Aluminosilicate Al₂O₃ > 13% | Fluegel 2007 borderline; Giordano 2008 (GRD) deferred to future priority |

---

## Architectural Changes Required

### 1. Replace the `VISCOSITY_PARAMETERS` constant table

Remove the 9-entry fake parameter table. Replace with three typed objects holding
only the regression coefficients for Lakatos 1976 and Fluegel 2007, plus the
Hetherington 1964 fixed constants. These are **not** VFT parameters — they are
regression inputs. The VTF parameters (A, B, T₀) are **computed per composition**
from the three-point analytical fit.

### 2. Remove `calculateBParameter()` from the service

Delete this method entirely. There is no published basis for summing K/wt% deltas
onto a single B parameter for any of these models.

### 3. Replace `detectViscosityModel()` with `selectModel()`

New logic:
1. If SiO₂ > 99%: use Hetherington 1964 (pure silica)
2. If slag (CaO > 30%, SiO₂ < 40%): return NOT_SUPPORTED error
3. If fluoride glass (total fluoride > 20%): return NOT_SUPPORTED error
4. If composition is within Lakatos 1976 validity bounds (SiO₂ 50–77 wt%, Na₂O ≥ 10%,
   only Lakatos components present without large extrapolation): use Lakatos 1976
5. Otherwise: use Fluegel 2007

### 4. Replace the VFT evaluation in `calculateViscosity()`

Instead of:
```
B = calculateBParameter(...)          // REMOVE
logViscosity = A + B / (T_K - T0)    // was using fixed params
```

Use:
```
const isokomPts = model.predictIsokoms(composition)   // Lakatos or Fluegel
const vtf = fitVtfThreePoints(isokomPts[0], isokomPts[1], isokomPts[2])
logViscosity = vtf.A + vtf.B / (T_celsius - vtf.T0)  // T in °C, not K
```

### 5. Update `ViscosityModel` enum

Remove the 9 fake model entries. Add:
- `LAKATOS_1976`
- `FLUEGEL_2007`
- `HETHERINGTON_1964`
- `NOT_SUPPORTED` (for slag and fluoride glass)

### 6. Update `ViscosityParameters` interface

The current interface (A, B, T₀, componentEffects) is no longer appropriate.
Split into separate typed interfaces:
- `LakatosCoefficients` — isokom regression table
- `FluegelCoefficients` — three polynomial tables (one per viscosity level)
- `HetheringtonParams` — two fixed numbers (A, B for log₁₀ Arrhenius)
- `VtfFitResult` — computed (A, B, T₀) from three-point solve

---

## Implementation Order

1. **Create** `docs/algorithms/glass-viscosity/IMPLEMENTATION_PLAN.md` ← this file ✅
2. **Implement** Lakatos 1976 in `glass-viscosity.service.ts`:
   - Add `predictIsokomsLakatos()` method using coefficients from page_001_table_007.csv
   - Add `fitVtfThreePoints()` method (analytical three-point solve)
   - Add `temperatureAtViscosity()` inverse
   - Update model selection to route SLS compositions to Lakatos
3. **Implement** Fluegel 2007 in `glass-viscosity.service.ts`:
   - Add `predictIsokomsFluegel()` method using table4/5/6 coefficients
   - Reuse VTF fitting and inversion from step 2
   - Update model selection to route other compositions to Fluegel
4. **Implement** Hetherington 1964 for pure silica:
   - Simple `log₁₀(η) = −3.905 + 31400/T_K` branch (no VTF fitting needed)
5. **Remove** all nine fake model entries and `calculateBParameter()`
6. **Update** enum, interfaces, and constants
7. **Add** NOT_SUPPORTED error responses for slag and fluoride glass
8. **Run** validation against data in `glass-viscosity-v2/chapter-10-validation-dataset.md`

---

## Key Formulas Reference

### Lakatos isokom regression (wt units: parts per 100 parts SiO₂)

```
T(v) = C₀(v) + Σ Cᵢ(v)·xᵢ + C_B₂O₃²(v)·x_B₂O₃²
```

Coefficients from `page_001_table_007.csv` (log η in poise):

| Component | v=2 | v=4 | v=6 |
|-----------|-----|-----|-----|
| Constant | 1847.8 | 1249.7 | 962.9 |
| Al₂O₃ | 8.32 | 5.23 | 4.01 |
| Na₂O | −12.65 | −9.19 | −7.06 |
| K₂O | −5.93 | −4.17 | −3.53 |
| Li₂O | −35.54 | −30.04 | −26.45 |
| CaO | −11.27 | −3.99 | −0.74 |
| MgO | −5.87 | −0.12 | 0.91 |
| BaO | −5.67 | −3.04 | −1.88 |
| ZnO | −5.37 | −1.88 | −0.71 |
| PbO | −4.85 | −3.17 | −2.24 |
| B₂O₃ (linear) | −21.62 | −11.97 | −6.42 |
| (B₂O₃)² | 0.5122 | 0.3182 | 0.19 |

Isokom labels are in **poise** → convert to Pa·s by subtracting 1 before VTF fitting.

### VTF three-point analytical fit (T in °C)

```
T₀ = (T₂T₃(y₂−y₃) + T₁T₃(y₃−y₁) + T₁T₂(y₁−y₂)) / (T₃(y₂−y₃) + T₁(y₃−y₁) + T₂(y₁−y₂))
B  = (y₂−y₁) × (T₁−T₀) × (T₂−T₀) / (T₁−T₂)
A  = y₁ − B / (T₁−T₀)
```

Inversion: `T = B / (log η − A) + T₀`

### Hetherington 1964 (pure silica, T in Kelvin)

```
log₁₀(η [Pa·s]) = −3.905 + 31400/T_K
```

---

## References

- Lakatos, T.; Johansson, L-G.; Simmingskőld, B. (1976). "Updated factors for calculation of
  viscosity." August 1976 supplement. Source: `shared/sources/lakatos_ocr/`
- Fluegel, A. (2007). "Glass viscosity calculation based on a global statistical modelling
  approach." *Glass Technology: European Journal of Glass Science and Technology Part A*
  48(1):13–30. Source: `shared/sources/fluegel_2007/`
- Hetherington, G.; Jack, K.H.; Kennedy, J.C. (1964). "The Viscosity of Vitreous Silica."
  *Physics and Chemistry of Glasses* 5(5):130–136.

