# Implementation Status

**Last Updated:** November 2026
**Overall Progress:** ~55%

> ⚠️ **Maintenance rule:** This file must be updated in the **same commit** as any change
> to a service, test file, or documentation entry. A PR that changes code without updating
> this file is considered incomplete. See [docs/CONVENTIONS.md — Definition of Done](../CONVENTIONS.md).

---

## Summary

| Module | Progress | Notes |
|--------|----------|-------|
| **Refractory** | ~85% | All 11 services + RefractoryThermalService + material catalogue (read-only) + mix composition; tests partially complete |
| **Thermodynamics** | ~55% | All 8 services + 3 controllers implemented; tests partial |
| **Common thermal library** | ~70% | 16 gas compounds, composition, numeric utils |
| **Frontend** | ~2% | Skeleton only — no pages or components yet |
| **Furnace** | 0% | Not started |
| **Recuperator** | 100% | Implemented — 4 modules: combustion, metals, thermal-exchange, recuperator |
| **Combustion** | 100% | `backend/src/modules/combustion/` — 4 modes (solid direct, two-step, fluid, kinetic bed) on one enthalpy/equilibrium core; hydrocarbon gases + MAP-gas preset |
| **Metals** | 100% | `backend/src/modules/metals/` — poly λ/ε (`aisi_304`, `mild_steel`) + synthesized ASM dataset (`shared/processed/metal-data`, spline λ/Cp/CTE/ρ); optional `lambdaModel=kCT56` Chebyshev F(C,T) carbon-steel alternative; `GET /metals/list`; Abu-Eishah pure-metal λ joined into compound-data; spec [`METAL_DATA_SPEC.md`](../scripts/METAL_DATA_SPEC.md), algorithm [`KCT56_CARBON_STEEL_CONDUCTIVITY.md`](../algorithms/metals/KCT56_CARBON_STEEL_CONDUCTIVITY.md) |
| **Thermal Exchange** | 100% | `backend/src/modules/thermal-exchange/` — MultilayerWallService + RecuperatorHtcService |
| **Thermal Distribution** | 100% | Fully implemented, 31 test suites, 602 tests passing |
| **Thermophysical** | 0% | Not started |
| **Database migrations** | 0% | Not started |
| **E2E tests** | 0% | Not started |

---

## Refractory Module — ~80%

**Base path:** `backend/src/modules/refractory/`

### Structure
- [x] `refractory.module.ts`
- [x] `refractory.controller.ts` (+ `POST /mix/composition`)
- [x] `material-catalog.controller.ts` — read-only catalogue, tag `materials` ([API §16](../api/REFRACTORY_API_SPEC.md))

### Material catalogue and mix composition (September 2026)

| Service | Tests | Notes |
|---------|-------|-------|
| `material-catalog.service.ts` | ✅ `material-catalog.service.spec.ts` | 102 unique active materials; groups, categories by primary group |
| `mix-component-catalog.service.ts` | ✅ `mix-component-catalog.service.spec.ts` | 60 mix components (binder, oxide, silicate, clay, carbide, nitride); `paper_clay` excluded |
| `particle-size-catalog.service.ts` | ✅ `particle-size-catalog.service.spec.ts` | six size tables |
| `mix-composition.service.ts` | ✅ `mix-composition.service.spec.ts` | fired basis; algorithm in [`MIX_COMPOSITION_ALGORITHM.md`](../algorithms/mix/MIX_COMPOSITION_ALGORITHM.md) |
| `refractory-thermal.service.ts` — `listProducts`, `getProperties` | ✅ extended spec | 19 products; ε clamped |

- DTOs and enums (one per file): listed in [`INTERFACES_IMPLEMENTATION_INDEX.md`](../INTERFACES_IMPLEMENTATION_INDEX.md)
- DTO specs: `test/unit/refractory/dto/` (refractory-product-query, material-list-query, material-group-route-param, material-id-param, mix-composition-input), `test/unit/metals/dto/metal-thermal-query.dto.spec.ts`
- HTTP routing spec: `test/unit/refractory/controllers/material-catalog.controller.spec.ts` (static routes not captured by `/:groupRoute`)

### Services (11 / 11 implemented)

| Service | Lines | Tests | Notes |
|---------|-------|-------|-------|
| `blend-optimizer.service.ts` | 446 | ✅ Full (`blend-optimizer-demo.spec.ts` — 269 lines) | |
| `glass-viscosity.service.ts` | 486 | ✅ Full (206 + 88 + utils specs) | VFT, Isokom, Lakatos comparison |
| `phase-equilibrium.service.ts` | 275 | ⚠️ Skeleton (23 lines) | Needs expansion |
| `packing.service.ts` | 352 | ✅ Good (83 lines) | |
| `refractoriness.service.ts` | 291 | ⚠️ Skeleton (33 lines) | Needs expansion |
| `shrinkage.service.ts` | 340 | ⚠️ Skeleton (42 lines) | Needs expansion |
| `psd-calculator.service.ts` | 116 | ✅ Good (47 lines) | |
| `mineral-phase.service.ts` | 235 | ⚠️ Skeleton (22 lines) | Needs expansion |
| `thermal-performance.service.ts` | 123 | ⚠️ Skeleton (23 lines) | Needs expansion |
| `water-demand.service.ts` | 148 | ✅ Full (376 lines) | |
| `participation.service.ts` | 57 | ⚠️ Skeleton (27 lines) | Needs expansion |

### DTOs (13 / 13)
- [x] `blend-optimization.dto.ts`
- [x] `common.dto.ts`
- [x] `glass-viscosity.dto.ts`
- [x] `mineral-phase.dto.ts`
- [x] `packing-calculation.dto.ts`
- [x] `packing-models.dto.ts`
- [x] `participation.dto.ts`
- [x] `phase-equilibrium.dto.ts`
- [x] `psd-calculation.dto.ts`
- [x] `refractoriness.dto.ts`
- [x] `shrinkage-prediction.dto.ts`
- [x] `thermal-conductivity.dto.ts`
- [x] `water-demand.dto.ts`

### Interfaces (11 / 11)
- [x] `blend-optimizer` shapes → `types/` + `utils/blend-optimizer-type-guards.ts` (`BlendOptimizerTypeGuards`) — Phase 6.3
- [x] `component-property.interface.ts`
- [x] `glass-viscosity` shapes → `types/` + `utils/glass-viscosity-type-guards.ts` (`GlassViscosityTypeGuards`) — Phase 6.3
- [x] `mineral-phase` shapes → `types/` + `utils/mineral-phase-type-guards.ts` (`MineralPhaseTypeGuards`) — Phase 6.3
- [x] `packing-calculator` shapes → `types/` + `utils/packing-type-guards.ts` (`PackingTypeGuards`) — Phase 6.3
- [x] `phase-equilibrium` shapes → `types/` + `utils/phase-equilibrium-type-guards.ts` (`PhaseEquilibriumTypeGuards`) — Phase 6.3
- [x] `psd-calculator` shapes → `types/psd-*.type.ts` + `utils/psd-type-guards.ts` (`PsdTypeGuards`) — Phase 6.3
- [x] `refractoriness` shapes → `types/` + `utils/refractoriness-type-guards.ts` (`RefractorinessTypeGuards`) — Phase 6.3
- [x] `shrinkage-calculator` shapes → `types/` + `utils/shrinkage-type-guards.ts` (`ShrinkageTypeGuards`) — Phase 6.3
- [x] `thermal-performance` shapes → `types/` + `utils/thermal-performance-type-guards.ts` (`ThermalPerformanceTypeGuards`) — Phase 6.3
- [x] `viscosity-parameters.interface.ts`

### Data interfaces (2 / 2, under `data/interfaces/`)
- [x] `glass-viscosity-validation.interface.ts`
- [x] `material.interface.ts`

### Entities (3 / 3)
- [x] `eutectic-data.entity.ts`
- [x] `material.entity.ts`
- [x] `mix-preset.entity.ts`

### Utility tests (5 spec files)
- [x] `glass-composition.util.spec.ts` (93 lines)
- [x] `glass-viscosity-isokom.spec.ts` (170 lines)
- [x] `glass-viscosity-lakatos-comparison.spec.ts` (101 lines)
- [x] `glass-viscosity-vtf.util.spec.ts` (89 lines)
- [x] `particle-size-classifier.util.spec.ts` (75 lines)

---

## Thermodynamics Module — ~55%

**Base path:** `backend/src/modules/thermodynamics/`

### Structure
- [x] `thermodynamics.module.ts`
- [x] `thermodynamics.controller.ts` (dimensionless + HTC endpoints)
- [x] `thermodynamics-fluid.controller.ts` (fluid/gas property endpoints)
- [x] `numeric.controller.ts` (Brent, Nelder-Mead, regression endpoints)

### Services (8 / 8 created)

| Service | Lines | Tests | Notes |
|---------|-------|-------|-------|
| `fluid-property.service.ts` | 292 | ❌ Missing | Core service — needs tests |
| `dimensionless-calculation.service.ts` | 223 | ❌ Missing | Nu, HTC — needs tests |
| `gas-properties.service.ts` | 182 | ❌ Missing | NASA-7 coefficients — needs tests |
| `radiation.service.ts` | 167 | ✅ Full (192 lines) | |
| `dimensionless-numbers.service.ts` | 159 | ❌ Missing | Re, Pr, Gr, Ra — needs tests |
| `transport.service.ts` | 78 | ❌ Missing | Thin implementation |
| `diffusion.service.ts` | 67 | ❌ Missing | |
| `aerodynamics.service.ts` | 40 | ❌ Missing | Thin implementation |

### DTOs (25+ files) — ✅ Complete
All input/output DTOs for fluid, dimensionless, geometry, numeric endpoints in `dto/index.ts`.

### Types (4 files) — ✅ Complete
- [x] `known-fluid.type.ts` + `KnownFluids` — named fluids = `FLUID_REGISTRY` keys (+ `gas_mix`); no separate allowlist
- [x] `correlation-name.type.ts`
- [x] `flow-regime.type.ts`

### Interfaces (3 files) — ✅ Complete
- [x] `fluid-property.interfaces.ts`
- [x] `nusselt-result.interface.ts`

### Controller test
- [x] `thermodynamics-fluid.controller.spec.ts` (332 lines)

### Documentation
- [x] [`docs/api/THERMODYNAMICS_API_SPEC.md`](../api/THERMODYNAMICS_API_SPEC.md) — API conventions (input format, DTOs, Swagger rules)
- [x] [`docs/api/REFRACTORY_API_SPEC.md`](../api/REFRACTORY_API_SPEC.md) — Refractory API conventions
- [x] `docs/services/THERMODYNAMICS_SERVICES.md` — Service method reference (formulas, correlations) ← **new May 2026**
- [ ] Algorithm entries in `docs/algorithms/README.md` — thermodynamics section pending

---

## Common Thermal Library — ~70%

**Base path:** `backend/src/common/thermal/`

### Gas compounds (16 species) — ✅ Complete
`air`, `ar`, `ch4`, `co2`, `co`, `h2o`, `h2`, `n2`, `nh3`, `no2`, `no`, `o2`, `so2`, `so3` + registry + index

### Composition — Partial
- [x] `air.composition.ts`
- [ ] Other gas mixtures

### Numeric utils — ✅ Complete
- [x] `gauss-legendre.util.ts`
- [x] `numeric-format.util.ts`
- [x] `numeric.util.ts`

### Tests
- [x] `gas-compounds.spec.ts` (188 lines)

### Documentation
- [x] `docs/services/COMMON_THERMAL_LIBRARY.md` — compound registry, interfaces, resolver, constants ← **new May 2026**

---

## Frontend — ~2%

**Base path:** `frontend/src/`  
Stack: React 19, Vite 7, MUI 7, React Query 5, React Router 7

- [x] `App.tsx` (entry point only)
- [x] `main.tsx`
- [ ] Pages (0 / ~10)
- [ ] Components (0)
- [ ] API hooks (0)
- [ ] Routing (0)

---

## Furnace Module — 0%

**Target path:** `backend/src/modules/furnace/`

- [ ] Module structure
- [ ] Combustion service
- [ ] Heat transfer service
- [ ] Efficiency service
- [ ] Stoichiometry service

Spec: [`STEP_02_FURNACE_MODULE.md`](STEP_02_FURNACE_MODULE.md)

---

## Recuperator Module — 100% ✅

**Implemented:** July 2026  
**Architecture:** 4 separate modules following SRP

### `combustion/` — 100%
**Path:** `backend/src/modules/combustion/`
- [x] `combustion.module.ts` — imports `ThermodynamicsModule`, `ThermalExchangeModule`
- [x] `services/combustion.service.ts` — facade; `flueGas()` runs the mode selected by the recuperator (`CombustionModeInputDto`); the carbon-equivalent `calculate()` and `POST /combustion/calculate` are removed (September 2026)
- [x] Shared core: `combustion-enthalpy.service.ts` (absolute enthalpy, fuel ΔHf ⇄ LHV), `product-equilibrium.service.ts` (element balance + WGS Kp(T)), `flame-solver.service.ts` (brentq on H_prod + Q_loss − H_react)
- [x] Mode 1/2 `solid-combustion.service.ts` (direct; two-step with computed T_step1, generator and furnace losses)
- [x] Mode 3 `fluid-combustion.service.ts` (gaseous by species, liquid by elemental analysis)
- [x] Mode 4 `bed-combustion.service.ts` + `chemical-kinetics.service.ts` (layer march, legacy kinetics, Gunn/Ergun, `MultilayerWallService` wall losses, steam injection, burnout)
- [x] `data/fuels/` — `charcoal-briquette`, `charcoal-oak` (verbatim `FuelDatabase.js`), `map-pro`
- [x] DTOs: `combustion-mode-input` (recuperator mode selection), `solid-direct`, `solid-two-step`, `fluid-fuel`, `bed-combustion`, `condensed-fuel`, `combustion-step-result`
- [x] `constants/combustion.constants.ts` — verified legacy values + `BED_KINETICS` (legacy E/A/ΔH)
- [x] `controllers/combustion.controller.ts` → `POST /combustion/solid/direct`, `/solid/two-step`, `/fluid`, `/bed`, `GET /combustion/fuels`
- [x] `GasPropertiesService.absoluteEnthalpy/absoluteEnthalpyMixture`, NASA-7 `entropy`/`gibbsEnergy`; SO2/SO3 NASA-7 low/high sets fixed
- [x] Gases C2H6, C3H8, C4H10, iC4H10, C2H2, C3H4, aC3H4, C3H6 + MAP-gas preset `map-pro` (composition to be confirmed)
- Algorithms: [`docs/algorithms/combustion/`](../algorithms/combustion/README.md)

### `refractory/` extension — 100%
- [x] `enums/refractory-thermal-material.enum.ts` — 19 refractory materials
- [x] `data/interfaces/refractory-thermal.interface.ts` — `RefractoryThermalEntry`, λ/ε coefficient types
- [x] `data/materials/refractory-thermal.data.ts` — `REFRACTORY_THERMAL_MATERIALS[]` + O(1) `REFRACTORY_THERMAL_MAP`
- [x] `services/refractory-thermal.service.ts` — pure computation (no hardcoded values)

### `metals/` — 100%
**Path:** `backend/src/modules/metals/`
- [x] `metals.module.ts`
- [x] `enums/metal-material.enum.ts` — AISI_304, MILD_STEEL (poly λ/ε overrides)
- [x] `types/metal-thermal-entry.type.ts`, `metal-lambda-coefficients.type.ts`, `metal-emissivity-coefficients.type.ts`, `metal-alloy-record.type.ts`, `metal-property-series.type.ts`, `metal-dataset-index.type.ts`
- [x] `data/materials/metal-thermal.data.ts` — poly `METAL_THERMAL_MATERIALS[]` + `METAL_THERMAL_MAP`
- [x] `utils/metal-dataset.ts` — loads `shared/processed/metal-data`
- [x] `services/metal-thermal.service.ts` — poly λ/ε + table cubic-spline λ/Cp/CTE/ρ + optional `lambdaKct56`
- [x] `dto/metal-thermal-query.dto.ts`, `metal-thermal-result.dto.ts`, `metal-summary.dto.ts`
- [x] `enums/metal-lambda-model.enum.ts` — `table` \| `kCT56`
- [x] `utils/kct56-conductivity.ts` + `data/kct56-conductivity.data.ts` — Chebyshev F(C,T) carbon-steel λ
- [x] `controllers/metals.controller.ts` → `GET /metals/list`, `GET /metals/thermal-properties?lambdaModel=`
- [x] Algorithm doc [`docs/algorithms/metals/KCT56_CARBON_STEEL_CONDUCTIVITY.md`](../algorithms/metals/KCT56_CARBON_STEEL_CONDUCTIVITY.md); fit log `tmp/reports/conductivity-fit/`
- [x] Dataset synthesis: `make metal-data-build` → `shared/processed/metal-data/`; pure-metal Abu-Eishah join into compound-data; spec [`METAL_DATA_SPEC.md`](../scripts/METAL_DATA_SPEC.md)
- [x] Steel composition gap fill (raw tables): ASM chem-composition PDF → tesseract inventory + Surya OCR → `tool_steel_composition.json`, `stainless_heat_resistant_composition.json`, `former_sae_steel_composition.json` (+ obsolete tool); coverage report `tmp/reports/python/metal-data/composition-gap-fill.json`
- [x] Alloy `materialId` / filenames prefer SAE/AISI (`sae-*` / `aisi-*`); UNS only when no grade is known (kept in `aliases.uns`)
- [x] Steel Andrews Ac1/Ac3 (`Andrews1965`) on alloy `criticalTemperatures`; property `approximation` by physics: λ and ρₑ = Ac3 `low`/`high` split (free linear above, then anchored quadratic; if continuous join fails gate, move `Tswitch` to a nearby measured knot via `switchMovedFromAc3_K`); Cp = `indenCp` @ Tc; α/density = single quadratic; donor **link + scale** under `provenance.donors`; ElMD donor ranking (`Hargreaves2020ElMD`); RefKeys `Andrews1965`, `Inden1981`, `HillertJarl1978`, `Hargreaves2020ElMD`

### `thermal-exchange/` — 100%
**Path:** `backend/src/modules/thermal-exchange/`
- [x] `thermal-exchange.module.ts`
- [x] `enums/wall-geometry.enum.ts` — FLAT, CYLINDER, SPHERE
- [x] `services/multilayer-wall.service.ts` — inner surface temperature via `brentq` on Q_inner − Q_outer (September 2026, replaced binary search; `endFactor` input removed), FD traverse, outer cooling
- [x] `services/recuperator-htc.service.ts` — overall HTC; air-side supports mixed compositions (air+steam, air+smoke); radiation via `gasRadiationHTC` when H₂O/CO₂ present
- [x] `dto/layer.dto.ts`, `multilayer-wall-input.dto.ts`, `multilayer-wall-result.dto.ts`
- [x] `dto/recuperator-htc-input.dto.ts` — optional `airComposition` (defaults to pure air)
- [x] `controllers/thermal-exchange.controller.ts` → `POST /thermal-exchange/multilayer-wall`

### `recuperator/` (thin) — 100%
**Path:** `backend/src/modules/recuperator/`
- [x] `recuperator.module.ts`
- [x] `enums/hole-form.enum.ts` — SQUARE, CIRCLE, TRIANGLE, CIRCLE_IN_RING
- [x] `services/recuperator-geometry.service.ts` — areas, perimeters, dEq, ray lengths
- [x] `services/recuperator.service.ts` — 8-neighbour grid-search optimizer
- [x] `dto/recuperator-input.dto.ts`, `recuperator-result.dto.ts`
- [x] `controllers/recuperator.controller.ts` → `POST /recuperator/calculate`

### Common utilities
- [x] `common/utils/math.util.ts` — `logMean(x1, x2)` (moved from `MultilayerWallService`, used across thermal-exchange + recuperator)

**Algorithm docs:** [`docs/algorithms/recuperator/`](../algorithms/recuperator/) (9 spec files)

---

## Thermal Distribution Module — 0%

**Target path:** `backend/src/modules/thermal-distribution/`

- [ ] Module structure (not yet started)
- [ ] Volume-average temperature
- [ ] API design

Algorithm spec: [`docs/algorithms/thermal-distribution/`](../algorithms/thermal-distribution/) (12 spec files covering geometries, methods, API, calibration, validation, examples)

- Root finding standardised (September 2026): hollow-cylinder BC III eigenvalues via `brentq` (grid-scan brackets), J₀ zeros (`besselJ0Roots`) via `newtonPolish`. Profile formulas unchanged.
- Simpson's rule moved to `common/utils/simpson.util.ts` (`simpson`, re-exported from `quadrature.util.ts`); the two local copies in the former series util files removed. Results unchanged.
- Conventions Phase 5: series/eigenvalue helpers are static classes (`SeriesBc1`, `SeriesBc3Plate`/`Cylinder`/`Sphere`, `SeriesHollowBc3`, `EigenvaluesBc*`, `CharacteristicLength`); orchestration helpers `ThermalSeriesTemp` / `ThermalSeriesMean`; controller DTO adapter is `ThermalDistributionService.toProfileOptions`.

---

## Thermophysical Module — 0%

**Target path:** `backend/src/modules/thermophysical/` + `python/src/thermophysical/`

- [ ] Module structure
- [ ] Material database service
- [ ] Property calculator
- [ ] CSV/DB data migration
- [ ] PubChem integration

Spec: [`STEP_03_THERMOPHYSICAL_MODULE.md`](STEP_03_THERMOPHYSICAL_MODULE.md), [`thermophysical-library/`](thermophysical-library/)

---

## Database — 0%

- [ ] Schema migrations
- [ ] Data migration from legacy
- [ ] Seed data

Spec: [`STEP_05_DATABASE_MIGRATION.md`](STEP_05_DATABASE_MIGRATION.md)

---

## Testing — ~30%

### Backend unit tests

| Area | Spec files | Lines | Status |
|------|-----------|-------|--------|
| Refractory services | 12 | ~1070 | ⚠️ 4 full, 8 skeleton |
| Refractory utils | 5 | 528 | ✅ Full |
| Thermodynamics services | 1 (radiation) | 192 | ⚠️ Partial — 7 services missing |
| Thermodynamics controllers | 1 | 332 | ✅ Full |
| Common thermal | 1 | 188 | ✅ Full |
| Conventions (file length + structure) | 4 | ~700 | ✅ Passing in Docker — file-length baseline (20 code + 15 docs); structure baseline (V1=55, V2=25, V3=25, V5=47, V6=6) in `structure-baseline.json`. Docs mount: `./docs:/docs:ro`. |

### Missing
- [ ] Backend integration tests (0)
- [ ] Frontend tests (0)
- [ ] E2E tests (0)

Full test spec: [`docs/TEST_SPECIFICATION.md`](../TEST_SPECIFICATION.md)  
Per-service checklist: [`docs/SERVICE_TEST_CHECKLIST.md`](../SERVICE_TEST_CHECKLIST.md)

---

## Next Actions

### Highest priority

1. **Expand thin refractory test files** (phase-equilibrium, refractoriness, shrinkage, mineral-phase, thermal-performance, participation — all ~20-40 lines, need 100+ each)
2. **Add thermodynamics service tests** (fluid-property, dimensionless-calculation, gas-properties, dimensionless-numbers, diffusion, transport, aerodynamics)
3. **Frontend: first pages** — Phase Equilibrium + Blend Optimizer (highest user value)

### Conventions refactoring (in progress on `refactoring`)

Plan: [`CONVENTIONS_REFACTORING_PLAN.md`](CONVENTIONS_REFACTORING_PLAN.md).  
- [x] **Phase 0** — suite baseline (1137 tests), conventions + structure ratchet, Swagger snapshot, D2 equation-type exception in `CONVENTIONS.md`.  
- [x] **Phase 1** — `metals` pilot: split metal thermal shapes into `types/*.type.ts`.  
- [x] **Phase 2** — `thermodynamics`: known-fluid split; `CompoundFluidPropsService` (V7=0); helpers → `utils/` (V6=0); controller split by resource; structure baselines shrunk.
- [x] **Phase 3** — `common/`: V5→0; one-construct splits; `EquationValidity` static class; 40 data-shape interfaces → `types/*.type.ts` (kept `Equation` / `NasaThermo` / `NasaMethod`); docs updated.
- [x] **Phase 4** — combustion types + `BedMarchService`; `WallMaterialKey` split; recuperator smoke/balance extract (V9 −2, V2 −1).
- [x] **Phase 5** — `thermal-distribution`: CP5.0 bit-identical goldens; eigenvalue/series/characteristic-length → static classes; BC3 series split by geometry; `toProfileOptions` on service; `ThermalSeriesTemp`/`ThermalSeriesMean` extract (service ≤300); structure + file-length baselines shrunk.
- [x] **Phase 6.1** — refractory constants: `*.constants.ts` renames; `CALCULATION_CONSTANTS` / `BLEND_OPTIMIZER_CONSTANTS` single exports; `BlendOptimizerScenarios`; viscosity coefficients → `data/viscosity-parameters.data.ts`.
- [x] **Phase 6.2** — viscosity enums split (`ViscosityModel` / `ViscosityModelType` / `ConfidenceLevel` / `ExtrapolationRisk` + `VISCOSITY_MODEL_NAMES`); `GlassViscosityModelDto` / `ConversionDirectionDto` → `enums/`; water-demand DTO uses `WorkabilityType`.
- [x] **Phase 6.3 (partial)** — through `glass-viscosity` → `types/` + type-guard classes. Next: `viscosity-parameters`.
- [x] **Huber 2019 viscosity-of-gases → compound-data** — OCR’d `shared/processed/viscosity-gases/crc-huber-2019/`; source `shared/sources/viscosity-gases-huber-2019.json`; parser `compound_data.parsers.viscosity_gases` joins 35 CAS rows as `raw` viscosity/gas (null μ cells omitted; Air skipped). RefKey `Huber2019` only (2011 table not retained). Tests: `python/tests/compound_data/test_viscosity_gases.py`. Spec: [`COMPOUND_DATA_SPEC.md`](../scripts/COMPOUND_DATA_SPEC.md).
- [x] **Gas-viscosity equation precision order** — Huber2019 MAPE ranks sources Perry8 → Yaws1999 → VDI2010 → White3 (`VISCOSITY_GAS_SOURCE_PRIORITY`); per-CAS `def` from `shared/sources/viscosity-gas-defaults.json` (35 compounds). Huber `raw` stores `bestEquation`, `mape_pct`, `max_abs_pct` (2 decimal %), `nCompared`. Report: `tmp/reports/python/compound-data/viscosity-equation-precision.json`. Tests: `test_viscosity_gas_priority.py`, `test_viscosity_gases.py`.
- [x] **Transport μ uses viscosity `def`** — removed Sutherland hard-preference in `TransportService` / `CompoundFluidPropsService`; both call `CompoundPropertyResolver` so Huber-ranked defaults apply.
- [x] **Mixture λ HE / Chung1988** — `TransportService.thermalConductivityMixResult` switches on Chung \(y=V_{c,m}/(6V)\): Hirschfelder–Eucken Form A (Mason–Saxena) for \(y<0.01\), Chung 1988 for \(y\ge 0.01\). Critical/dipole scalars on `CompoundValue`; molar volume \(V\) from `GasDensity` (not ideal gas); algorithm doc `docs/algorithms/thermodynamics/MIXTURE_THERMAL_CONDUCTIVITY.md`; RefKey `Chung1988`.
- [x] **Helmholtz density (CoolProp)** — vendored `shared/sources/coolprop/` fluids + binary pairs + departure functions; compound-data `coolprop` keys (CAS attach via `coolprop_links`); `coolpropKey` on `CompoundValue` from `coolprop[0]`; density stack under `modules/thermodynamics/utils/density/` (`HelmholtzDensity`, `GasDensity`, …); wired into fluid/compound/mixture density paths. Algorithm: `docs/algorithms/thermodynamics/HELMHOLTZ_DENSITY.md`.
- [x] **NIST IR 8209 residual + critical λ** — under `utils/conductivity/` (`CoolpropTransportData` / `CoolpropConductivity` / `CoolpropOlchowySengers`); dilute + residual + `simplified_Olchowy_Sengers` critical; pure \(\lambda=\lambda^0+\lambda^r+\lambda^{\mathrm{crit}}\) in `TransportService` / `CompoundFluidPropsService` with \(\rho\) from `GasDensity`. CoolProp `expression` residual / hardcoded critical deferred. Mixture λ remains HE/Chung (`utils/conductivity/`). Viscosity mixer: `utils/viscosity/WilkeViscosity`. RefKey `NISTIR8209`. Algorithm: `docs/algorithms/thermodynamics/NISTIR_8209_THERMAL_CONDUCTIVITY.md`.
- [x] **Transport utils layout** — algorithm realisations split by property: `utils/density/`, `utils/conductivity/`, `utils/viscosity/`, plus shared `utils/chapman-enskog/` (Neufeld Ω, LJ combining).
- [x] **Peng–Robinson density fallback** — when no CoolProp fluid, use PR from \(T_c,P_c,\omega\) (`criticalPressure` on `CompoundValue`); ideal gas only inside `IDEAL_GAS_DENSITY_LIMITS` (else throw); PR + Helmholtz/ideal-gas density constants live under `modules/thermodynamics/`. Algorithm: `docs/algorithms/thermodynamics/GAS_DENSITY.md`.
- [x] **Chapman–Enskog μ + Eucken λ + Stockmayer** — shared Neufeld \(\Omega_D/\Omega_v\) + LJ combining in `utils/chapman-enskog/`; CE \(\mu\) (LJ/Stockmayer) and Poling `1.858e-3` binary \(D\) under `utils/viscosity/`; `stockmayerDelta` on `CompoundValue`; `TransportService` CE viscosity fallback and Eucken dilute \(\lambda\) after CE \(\mu\); `DiffusionService` thin orchestrator. Algorithm: `docs/algorithms/thermodynamics/CHAPMAN_ENSKOG_VISCOSITY.md`.
- [x] **CoolProp dense μ + Chung mixture μ** — evaluable CoolProp `TRANSPORT.viscosity` (collision_integral / Rainwater–Friend / Batschinski–Hildebrand) via `GasViscosity`; mixture Wilke + Chung Δη below \(y\) switch, full Chung dense μ above; Poling Ch.9 E-table (not 10-3). `POST /thermodynamics/properties` passes `P_Pa` into `viscosityMix`. Algorithm: `docs/algorithms/thermodynamics/COOLPROP_CHUNG_VISCOSITY.md`.

### Medium priority

4. **Transport / aerodynamics services** — thin implementations (40-78 lines), likely incomplete
5. **Recuperator module** — start after ThermodynamicsModule is stable; spec in [`recuperator/`](recuperator/)
6. **Combustion module** — Stage C per [`ROADMAP.md`](ROADMAP.md); spec in [`combustion/`](combustion/)
7. **Furnace module** — start Stage B per [`ROADMAP.md`](ROADMAP.md)
8. **Database migrations** — required before any persistent data features

---

*Update this file as progress is made.*
