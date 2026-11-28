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
| **Frontend** | ~55% | Materials hub (gases, metals, other materials / compound catalogue, refractories, glasses, mineral compositions / blend+phase); processes module; shared calc/charts UI |
| **Furnace** | — | Superseded — see Combustion (bed mode) + Thermodynamics; do not create `modules/furnace/` |
| **Recuperator** | 100% | Implemented — 4 modules: combustion, metals, thermal-exchange, recuperator |
| **Combustion** | 100% | `backend/src/modules/combustion/` — 4 modes (solid direct, two-step, fluid, kinetic bed) on one enthalpy/equilibrium core; hydrocarbon gases + MAP-gas preset |
| **Metals** | 100% | `backend/src/modules/metals/` — poly λ/ε (`aisi_304`, `mild_steel`) + synthesized ASM dataset (`shared/processed/metal-data`, spline λ/Cp/CTE/ρ); optional `lambdaModel=kCT56` Chebyshev F(C,T) carbon-steel alternative; `GET /metals/list`; Abu-Eishah pure-metal λ joined into compound-data; spec [`METAL_DATA_SPEC.md`](../scripts/METAL_DATA_SPEC.md), algorithm [`KCT56_CARBON_STEEL_CONDUCTIVITY.md`](../algorithms/metals/KCT56_CARBON_STEEL_CONDUCTIVITY.md) |
| **Thermal Exchange** | 100% | `backend/src/modules/thermal-exchange/` — MultilayerWallService + RecuperatorHtcService |
| **Thermal Distribution** | 100% | Fully implemented, 31 test suites, 602 tests passing |
| **Thermophysical** | 0% | Not started |
| **Database migrations** | 0% | Not started |
| **E2E tests** | 0% | Not started |
| **Project roadmap (docs)** | In progress | [`docs/PROJECT_ROADMAP.md`](../PROJECT_ROADMAP.md) — human roadmap; technical plans in [`docs/plans/`](../plans/README.md) |
| **Heat-treatment data (plan, phase 4)** | Plan only | Gaps G1–G10, new dataset kinds, steps D7–D11; no-legacy and no-tuning rules. Split into [`QUENCH_SOURCE_PICKLIST.md`](../plans/QUENCH_SOURCE_PICKLIST.md), [`SOLUTION_PROPERTY_ALGORITHM.md`](../plans/SOLUTION_PROPERTY_ALGORITHM.md), [`SOLUTION_VERIFICATION_EXAMPLES.md`](../plans/SOLUTION_VERIFICATION_EXAMPLES.md); main plan [`HEAT_TREATMENT_DATA.md`](../plans/HEAT_TREATMENT_DATA.md) |
| **Source-extractor (SE)** | ~85% | Phases 0–5 + full review port into SE (`source_extract/review/` split domain, `/api/v1/review`, React editor with tools/Analyze/Confirm/Undo). Host adapters + compose/nginx/`pd-*` shim. §12 cutover (Analyze GUI, NBS, OCR/LLM, history; delete local diagram-review) still open — [`SOURCE_EXTRACTOR_MIGRATION.md`](../plans/SOURCE_EXTRACTOR_MIGRATION.md) |

---

## Refractory Module — ~80%

**Base path:** `backend/src/modules/refractory/`

### Structure
- [x] `refractory.module.ts`
- [x] Refractory calculation controllers (`RefractoryCompositionController`, `RefractoryPackingController`, `RefractoryThermalController`; + `POST /mix/composition`)
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
| `blend-optimizer.service.ts` | 115 | ✅ Full (`blend-optimizer.service.spec.ts` + demo) | + evaluate/expand; ranking unit spec |
| `glass-viscosity.service.ts` | 283 | ✅ Full (206 + 88 + utils specs) | Model selection / result meta → static utils |
| `phase-equilibrium.service.ts` | 135 | ✅ Rewritten (orchestrator) | old CAS cubic model moved to `phase-equilibrium-legacy-eutectic.service.ts` (its spec renamed `…legacy-eutectic.service.spec.ts`) |
| Full phase equilibrium — scaffolding (input side) | — | ✅ `test/unit/refractory/utils/grain-reaction.spec.ts` | enums (`AlgorithmMode`, `LegacyVariant`, `PhaseEquilibriumMethod`, `UnreactedPhaseState`, `PhasePartSource`), `GRAIN_REACTION_CONSTANTS`, extended `PHASE_EQUILIBRIUM_CONSTANTS`, `utils/grain-reaction.ts` (`GrainReaction`), `dto/phase-equilibrium/phase-equilibrium-{fraction-,}input.dto.ts`; service and response DTOs not yet changed — [plan](../algorithms/phase-equilibrium/FULL_PHASE_EQUILIBRIUM.md) |
| Full phase equilibrium — engines v1 | — | ✅ `phase-equilibrium{,-calphad,-legacy-eutectic}.service.spec.ts`, `utils/{eutectic-index,legacy-engine-adapter,calphad-gibbs-minimizer,amorphous-remainder,cas-liquid-excess}.spec.ts`, `data/mineralogy-consistency.spec.ts` | Orchestrator + Gibbs with CAS liquid excess ladder (Abdul associates → Mao P–Q → oxide RK), eutectic/Tm fallback, XRD mineralogy for all mix components, glass points + Swagger DTOs; `legacyDiagram` + refractoriness L(T)+η still open — [plan](../algorithms/phase-equilibrium/FULL_PHASE_EQUILIBRIUM.md) |
| `packing.service.ts` | ~110 | ✅ Good | CPM = Stovall linear packing; micro-filler β₀ bonus + composition φ_max by default; blend optimiser no longer mis-wires scenario K; Furnas/fractions/resolve utils |
| `refractoriness.service.ts` | 291 | ✅ Expanded | ISO/ASTM/GOST standards, duty class, component buckets |
| `shrinkage.service.ts` | 153 | ✅ Expanded | complete + fromProfile; MSC defaults; validation |
| `psd-calculator.service.ts` | 116 | ✅ Good (47 lines) | |
| `mineral-phase.service.ts` | 235 | ✅ Expanded | alumina/silica/CAS/Mg/Fe/Cr/Zr/alkali + fallback |
| `thermal-performance.service.ts` | 123 | ✅ Expanded | porosity, T-dependence, composition breakdown |
| `water-demand.service.ts` | 148 | ✅ Full (376 lines) | |
| `participation.service.ts` | 57 | ✅ Expanded | 1/√d model, size/mass sensitivity, edge cases |

### DTOs (one class per file under `dto/`)
- [x] blend-optimization / blend-optimization-options
- [x] common: oxide-composition, fraction-input
- [x] glass-viscosity (+ profile / convert DTOs)
- [x] mineral-phase
- [x] packing: packing-cpm, packing-furnas, packing-calculation, …
- [x] participation / participation-fraction
- [x] phase-equilibrium: phase-calculation, phase-calculation-response
- [x] psd: andreasen-psd, funk-dinger-psd, psd-fraction
- [x] refractoriness, shrinkage-prediction, thermal-conductivity, water-demand

### Interfaces (11 / 11)
- [x] `blend-optimizer` shapes → `types/` + `utils/blend-optimizer-type-guards.ts` (`BlendOptimizerTypeGuards`) — Phase 6.3
- [x] `component-property.type.ts` (was `interfaces/component-property.interface.ts`)
- [x] `glass-viscosity` shapes → `types/` + `utils/glass-viscosity-type-guards.ts` (`GlassViscosityTypeGuards`) — Phase 6.3
- [x] `mineral-phase` shapes → `types/` + `utils/mineral-phase-type-guards.ts` (`MineralPhaseTypeGuards`) — Phase 6.3
- [x] `packing-calculator` shapes → `types/` + `utils/packing-type-guards.ts` (`PackingTypeGuards`) — Phase 6.3
- [x] `phase-equilibrium` shapes → `types/` + `utils/phase-equilibrium-type-guards.ts` (`PhaseEquilibriumTypeGuards`) — Phase 6.3
- [x] `psd-calculator` shapes → `types/psd-*.type.ts` + `utils/psd-type-guards.ts` (`PsdTypeGuards`) — Phase 6.3
- [x] `refractoriness` shapes → `types/` + `utils/refractoriness-type-guards.ts` (`RefractorinessTypeGuards`) — Phase 6.3
- [x] `shrinkage-calculator` shapes → `types/` + `utils/shrinkage-type-guards.ts` (`ShrinkageTypeGuards`) — Phase 6.3
- [x] `thermal-performance` shapes → `types/` + `utils/thermal-performance-type-guards.ts` (`ThermalPerformanceTypeGuards`) — Phase 6.3
- [x] `viscosity-parameters` shapes → `types/` (Vtf*/Lakatos/Fluegel/Slag/ModelSelection) — Phase 6.3

### Data interfaces (2 / 2, under `data/interfaces/`)
- [x] `glass-viscosity-validation.interface.ts`
- [x] `material.interface.ts`

### Entities (3 / 3)
- [x] `eutectic-data.entity.ts`
- [x] `material.entity.ts`
- [x] `mix-preset.entity.ts`

### Utility tests (5 spec files)
- [x] `glass-composition.spec.ts` (`GlassComposition` + `InvalidCompositionError`)
- [x] `glass-viscosity-isokom.spec.ts` (170 lines)
- [x] `glass-viscosity-lakatos-comparison.spec.ts` (101 lines)
- [x] `glass-viscosity-vtf.spec.ts` (GlassViscosityVtf / LakatosIsokoms static classes)
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
| `fluid-property.service.ts` | 261 | ✅ Added | catalogues + Cp/μ/ρ/λ + validation |
| `dimensionless-calculation.service.ts` | 244 | ✅ Added | resolveFluid, Re/Pr/Gr/Ra, Nu |
| `gas-properties.service.ts` | 297 | ✅ Present | NASA H/S/G + Cp (97 lines) |
| `radiation.service.ts` | 165 | ✅ Full (192 lines) | |
| `dimensionless-numbers.service.ts` | 156 | ✅ Added | scalars, geometry, Nu dispatcher |
| `transport.service.ts` | 263 | ✅ Present | mixture λ/μ (180 lines) |
| `diffusion.service.ts` | 67 | ✅ Expanded | binary + Wilke effective D |
| `aerodynamics.service.ts` | 40 | ✅ Added | Ergun ΔP/L + superficial velocity |
| `compound-fluid-props.service.ts` | 187 | ✅ Present | 103 lines |

### DTOs (25+ files) — ✅ Complete
All input/output DTOs for fluid, dimensionless, geometry, numeric endpoints in `dto/index.ts`.

### Types (4 files) — ✅ Complete
- [x] `known-fluid.type.ts` + `KnownFluids` — named fluids = `FLUID_REGISTRY` keys (+ `gas_mix`); no separate allowlist
- [x] `correlation-name.type.ts`
- [x] `flow-regime.type.ts`

### Interfaces / catalogue types — ✅ Complete
- [x] fluid catalogue shapes → `types/flow-mode-entry.type.ts` etc. (Phase 8)
- [x] `nusselt-result.interface.ts`

### Controller test
- [x] `thermodynamics-fluid.controller.spec.ts` (332 lines)

### Documentation
- [x] [`docs/api/THERMODYNAMICS_API_SPEC.md`](../api/THERMODYNAMICS_API_SPEC.md) — API conventions (input format, DTOs, Swagger rules)
- [x] [`docs/api/REFRACTORY_API_SPEC.md`](../api/REFRACTORY_API_SPEC.md) — Refractory API conventions
- [x] `docs/services/THERMODYNAMICS_SERVICES.md` — Service method reference (formulas, correlations) ← **new May 2026**
- [x] Algorithm entries in `docs/algorithms/README.md` — thermodynamics section + `docs/algorithms/thermodynamics/`

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

## Frontend — ~55%

**Base path:** `frontend/src/`  
Stack: React 19, Vite 7, MUI 7, React Query 5, React Router 7  
Architecture: [`docs/frontend/architecture_refactor/ARCHITECTURE.md`](../frontend/architecture_refactor/ARCHITECTURE.md)

- [x] App shell, router, materials + processes hubs
- [x] Materials sections: gases (pure + mixture), metals, refractories, glasses, raw materials, mineral compositions
- [x] Phase equilibrium + blend optimizer UI (`mineral-compositions/` — chemistry + blend APIs)
- [x] Shared calc forms, result tables/cards, Highcharts wrappers, units/settings
- [ ] Remaining process calculators (combustion/bed UI exists; other processes TBD)
- [ ] Full contract coverage vs Swagger
- [x] Gas charts: plot any present property; T axis follows form °C/K (live unit sync)

---

## Furnace Module — superseded

**Do not implement** `backend/src/modules/furnace/`. Legacy `furnaceCombustion` landed in:

- **Thermodynamics** — transport, diffusion, aerodynamics (Ergun), Gunn Nu
- **Combustion** — solid / fluid / **bed** (`POST /combustion/bed` = packed-bed layer model)
- **Frontend** — `frontend/src/modules/processes/sections/combustion/`

Historical plan: [`STEP_02_FURNACE_MODULE.md`](STEP_02_FURNACE_MODULE.md) (banner: superseded).

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
- [x] `services/multilayer-wall.service.ts` — inner surface temperature via `brentq` on Q_inner − Q_outer (September 2026, replaced binary search; `endFactor` input removed), FD traverse with λ(T), returns `temperatureProfile`, outer cooling
- [x] `services/recuperator-htc.service.ts` — overall HTC; air-side supports mixed compositions (air+steam, air+smoke); radiation via `gasRadiationHTC` when H₂O/CO₂ present
- [x] `dto/layer.dto.ts`, `multilayer-wall-input.dto.ts`, `multilayer-wall-result.dto.ts`, `wall-temperature-point.dto.ts`
- [x] `dto/recuperator-htc-input.dto.ts` — optional `airComposition` (defaults to pure air)
- [x] `controllers/thermal-exchange.controller.ts` → `POST /thermal-exchange/multilayer-wall`

### `recuperator/` (thin) — 100%
**Path:** `backend/src/modules/recuperator/`
- [x] `recuperator.module.ts`
- [x] `enums/hole-form.enum.ts` — SQUARE, CIRCLE, TRIANGLE, CIRCLE_IN_RING
- [x] `services/recuperator-geometry.service.ts` — areas, perimeters, dEq, ray lengths
- [x] `services/recuperator.service.ts` — 8-neighbour grid-search optimizer; optional `wallMaterial` → λ(T)/ε(T) via `MultilayerWallService`, returns `wallPropertyProfile`
- [x] `dto/recuperator-input.dto.ts`, `recuperator-result.dto.ts`, `wall-property-point.dto.ts`
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
| Refractory services | 12+ | expanded | ✅ Expanded; blend-optimizer has mocked unit spec (+ demo) |
| Refractory data / utils | several | — | ✅ Component properties + eutectic systems specs |
| Thermodynamics services | 9 | — | ✅ Aerodynamics, diffusion, dimensionless, gas-props, radiation, transport, … |
| Thermodynamics controllers | 1+ | — | ✅ Fluid controller covered |
| Common thermal | 1+ | — | ✅ Gas compounds + related |
| Conventions (file length + structure) | 4 | — | ✅ Baselines empty; ratchet green (host or Docker) |

### Missing
- [ ] Backend integration tests (0)
- [ ] Frontend tests (0)
- [ ] E2E tests (0)

Full test spec: [`docs/TEST_SPECIFICATION.md`](../TEST_SPECIFICATION.md)  
Per-service checklist: [`docs/SERVICE_TEST_CHECKLIST.md`](../SERVICE_TEST_CHECKLIST.md)

---

## Next Actions

### Highest priority

1. ~~**Expand thin refractory test files**~~ — done
2. ~~**Add thermodynamics service tests**~~ — done
3. ~~**Frontend: Phase Equilibrium + Blend Optimizer**~~ — already in `mineral-compositions/`; gas charts now sync T unit + plot present keys
4. ~~**Phase 8.2 coverage report**~~ — done: 98 suites / 1385 passed; 87.17 % stmts / 88.32 % lines (`test:cov` 2026-11-24)
5. **Frontend verify** — restore full `frontend/node_modules` (vitest/highcharts) and run `npm test` / `npm run typecheck`
6. ~~**Furnace module**~~ — superseded by Combustion + Thermodynamics (see section above)
7. ~~**Blend-optimizer unit tests**~~ — `blend-optimizer.service.spec.ts` (mocked evaluate/expand) + `blend-optimizer-ranking.spec.ts`; demo retained

### Conventions refactoring (complete on `refactoring`)

Plan: [`CONVENTIONS_REFACTORING_PLAN.md`](CONVENTIONS_REFACTORING_PLAN.md).  
- [x] **Phase 0** — suite baseline (1137 tests), conventions + structure ratchet, Swagger snapshot, D2 equation-type exception in `CONVENTIONS.md`.  
- [x] **Phase 1** — `metals` pilot: split metal thermal shapes into `types/*.type.ts`.  
- [x] **Phase 2** — `thermodynamics`: known-fluid split; `CompoundFluidPropsService` (V7=0); helpers → `utils/` (V6=0); controller split by resource; structure baselines shrunk.
- [x] **Phase 3** — `common/`: V5→0; one-construct splits; `EquationValidity` static class; 40 data-shape interfaces → `types/*.type.ts` (kept `Equation` / `NasaThermo` / `NasaMethod`); docs updated.
- [x] **Phase 4** — combustion types + `BedMarchService`; `WallMaterialKey` split; recuperator smoke/balance extract (V9 −2, V2 −1).
- [x] **Phase 5** — `thermal-distribution`: CP5.0 bit-identical goldens; eigenvalue/series/characteristic-length → static classes; BC3 series split by geometry; `toProfileOptions` on service; `ThermalSeriesTemp`/`ThermalSeriesMean` extract (service ≤300); structure + file-length baselines shrunk.
- [x] **Phase 6.1** — refractory constants: `*.constants.ts` renames; `CALCULATION_CONSTANTS` / `BLEND_OPTIMIZER_CONSTANTS` single exports; `BlendOptimizerScenarios`; viscosity coefficients → `data/viscosity-parameters.data.ts`.
- [x] **Phase 6.2** — viscosity enums split (`ViscosityModel` / `ViscosityModelType` / `ConfidenceLevel` / `ExtrapolationRisk` + `VISCOSITY_MODEL_NAMES`); `GlassViscosityModelDto` / `ConversionDirectionDto` → `enums/`; water-demand DTO uses `WorkabilityType`.
- [x] **Phase 6.3** — refractory `interfaces/` multi-exports → `types/*.type.ts` + `*TypeGuards` static classes; structure baselines cleared for those files.
- [x] **Phase 6.4** — refractory utils: VTF split; `ViableRangeFormatter`; `GlassComposition` + `InvalidCompositionError`; `CompositionCharacteristics` → `types/`; `GlassViscosityArrhenius`; `GlassViscosityIida`. Refractory `exportedFreeFunctions` baseline empty.
- [x] **Phase 6.5** — refractory services/controller under 300: packing (`CPMCalibration` type + Furnas/resolve utils); mix-thermal private round helpers; shrinkage models/stages + constants; glass-viscosity model-selection/result-meta; blend-optimizer evaluate/expand/ranking; controller split into composition/packing/thermal (routes identical). File-length + packing structure baselines cleared.
- [x] **Phase 7** — split all 15 docs over 500 lines into topic files + parent indexes; file-length baseline empty; stale heat-conduction/compound-data links fixed; `make doc-links` green.
- [x] **Phase 8** — structure baseline cleared; `codemod-*.mjs` removed; Jest ratchets only; **8.2** `test:cov` 87.17 % stmts / 88.32 % lines (98 suites / 1385 passed, 2026-11-24).
- [x] **Huber 2019 viscosity-of-gases → compound-data** — OCR’d `shared/processed/viscosity-gases/crc-huber-2019/`; source `shared/sources/viscosity-gases-huber-2019.json`; parser `compound_data.parsers.viscosity_gases` joins 35 CAS rows as `raw` viscosity/gas (null μ cells omitted; Air skipped). RefKey `Huber2019` only (2011 table not retained). Tests: `python/tests/compound_data/test_viscosity_gases.py`. Spec: [`COMPOUND_DATA_SPEC.md`](../scripts/COMPOUND_DATA_SPEC.md).
- [x] **Gas-viscosity equation precision order** — Huber2019 MAPE ranks sources Perry8 → Yaws1999 → VDI2010 → White3 (`VISCOSITY_GAS_SOURCE_PRIORITY`); per-CAS `def` from `shared/sources/viscosity-gas-defaults.json` (35 compounds). Huber `raw` stores `bestEquation`, `mape_pct`, `max_abs_pct` (2 decimal %), `nCompared`. Report: `tmp/reports/python/compound-data/viscosity-equation-precision.json`. Tests: `test_viscosity_gas_priority.py`, `test_viscosity_gases.py`.
- [x] **Transport μ uses viscosity `def`** — removed Sutherland hard-preference in `TransportService` / `CompoundFluidPropsService`; both call `CompoundPropertyResolver` so Huber-ranked defaults apply.
- [x] **Mixture λ HE / Chung1988** — `TransportService.thermalConductivityMixResult` switches on Chung \(y=V_{c,m}/(6V)\): Hirschfelder–Eucken Form A (Mason–Saxena) for \(y<0.01\), Chung 1988 for \(y\ge 0.01\). Critical/dipole scalars on `CompoundValue`; molar volume \(V\) from `GasDensity` (not ideal gas); algorithm doc `docs/algorithms/thermodynamics/MIXTURE_THERMAL_CONDUCTIVITY.md`; RefKey `Chung1988`.
- [x] **Solid-phase thermo (Engine C)** — `CompoundValueBuilder.forSolid` (+ `CompoundSolidData`), optional `viscosity` / `thermalConductivity`, `entropy298` on `CompoundValue`; `CompoundPropertyResolver` H/S/G fall back from NASA to the Cp-integral path (`SolidThermoFromCp`, `SOLID_THERMO` constants). Test: `backend/test/unit/common/thermal/compound-properties/solid-compound-gibbs.spec.ts` (written; run in Docker). Doc: `docs/services/COMMON_THERMAL_LIBRARY.md`.
- [x] **Liquid fluid / HTC** — `CompoundValue.density` bucket; `CompoundLiquidValue.forTransport` + `CompoundPropertyResolver.densityResult`; `CompoundFluidPropsService` liquid path; flat `phase: 'liquid'` on fluid/dimensionless DTOs; `CompoundLiquidBounds` + `GET /compounds/:id/liquid-bounds`; search `liquidsOnly`. Frontend: Other materials liquid sweep + HTC liquid mode. Tests: `liquid-compound-transport.spec.ts`, dimensionless liquid water Nu. Docs: THERMODYNAMICS_API_SPEC, COMMON_THERMAL_LIBRARY, THERMODYNAMICS_SERVICES.
- [x] **Helmholtz density (CoolProp)** — vendored `shared/sources/coolprop/` fluids + binary pairs + departure functions; compound-data `coolprop` keys (CAS attach via `coolprop_links`); `coolpropKey` on `CompoundValue` from `coolprop[0]`; density stack under `modules/thermodynamics/utils/density/` (`HelmholtzDensity`, `GasDensity`, …); wired into fluid/compound/mixture density paths. Algorithm: `docs/algorithms/thermodynamics/HELMHOLTZ_DENSITY.md`.
- [x] **NIST IR 8209 residual + critical λ** — under `utils/conductivity/` (`CoolpropTransportData` / `CoolpropConductivity` / `CoolpropOlchowySengers`); dilute + residual + `simplified_Olchowy_Sengers` critical; pure \(\lambda=\lambda^0+\lambda^r+\lambda^{\mathrm{crit}}\) in `TransportService` / `CompoundFluidPropsService` with \(\rho\) from `GasDensity`. CoolProp `expression` residual / hardcoded critical deferred. Mixture λ remains HE/Chung (`utils/conductivity/`). Viscosity mixer: `utils/viscosity/WilkeViscosity`. RefKey `NISTIR8209`. Algorithm: `docs/algorithms/thermodynamics/NISTIR_8209_THERMAL_CONDUCTIVITY.md`.
- [x] **Transport utils layout** — algorithm realisations split by property: `utils/density/`, `utils/conductivity/`, `utils/viscosity/`, plus shared `utils/chapman-enskog/` (Neufeld Ω, LJ combining).
- [x] **Peng–Robinson density fallback** — when no CoolProp fluid, use PR from \(T_c,P_c,\omega\) (`criticalPressure` on `CompoundValue`); ideal gas only inside `IDEAL_GAS_DENSITY_LIMITS` (else throw); PR + Helmholtz/ideal-gas density constants live under `modules/thermodynamics/`. Algorithm: `docs/algorithms/thermodynamics/GAS_DENSITY.md`.
- [x] **Chapman–Enskog μ + Eucken λ + Stockmayer** — shared Neufeld \(\Omega_D/\Omega_v\) + LJ combining in `utils/chapman-enskog/`; CE \(\mu\) (LJ/Stockmayer) and Poling `1.858e-3` binary \(D\) under `utils/viscosity/`; `stockmayerDelta` on `CompoundValue`; `TransportService` CE viscosity fallback and Eucken dilute \(\lambda\) after CE \(\mu\); `DiffusionService` thin orchestrator. Algorithm: `docs/algorithms/thermodynamics/CHAPMAN_ENSKOG_VISCOSITY.md`.
- [x] **CoolProp dense μ + Chung mixture μ** — evaluable CoolProp `TRANSPORT.viscosity` (collision_integral / Rainwater–Friend / Batschinski–Hildebrand) via `GasViscosity`; mixture Wilke + Chung Δη below \(y\) switch, full Chung dense μ above; Poling Ch.9 E-table (not 10-3). `POST /thermodynamics/properties` passes `P_Pa` into `viscosityMix`. Algorithm: `docs/algorithms/thermodynamics/COOLPROP_CHUNG_VISCOSITY.md`.
- [x] **Component registry formula keys** — `COMPONENT_PROPERTIES` / category maps keyed by chemical formula (`SiO2`, …) matching OxideCompositionDto; fixes silent no-op of refractoriness/liquidus/λ effects when API sent mixed-case formulas.
- [x] **Component properties SRP split** — dataset → `data/component-properties.data.ts` (single `COMPONENT_PROPERTIES` export); helpers → `utils/component-properties.ts` (`ComponentProperties` static class); category result → `types/components-by-category.type.ts`. Old multi-export `data/component-properties.ts` removed.
- [x] **Eutectic systems SRP split** — `data/eutectic-systems.data.ts` dataset only; `types/eutectic-system-point.type.ts`; `utils/eutectic-systems.ts` (`EutecticSystems`); repository uses static class.
- [x] **Materials index cleanup** — single `ALL_MATERIALS` export in `data/all-materials.data.ts`; removed unused helpers / re-exports / `MATERIAL_COUNTS` from old `materials-index.ts`.
- [x] **Furnace status + ROADMAP refresh** — mark STEP_02 / Furnace as superseded; ROADMAP module-map statuses match shipped thermo / combustion / recuperator / refractory.

### Medium priority

4. ~~**Transport / aerodynamics services**~~ — aerodynamics + transport covered by unit tests; Ergun ΔP implemented
5. ~~**Recuperator / combustion modules**~~ — already at 100% in this status file
6. ~~**Furnace module**~~ — superseded (combustion bed + thermodynamics)
7. **Database migrations** — required before any persistent data features
8. ~~**Refresh [`ROADMAP.md`](ROADMAP.md)**~~ — module-map statuses updated

### USGS Bulletin 2131 staging OCR (November 2026)

- [x] PDF at `shared/sources/compound-data/USGS Bulletin 2131 Thermodynamic properties of minerals (Robie Hemingway 1995).pdf`
- [x] RefKey `RobieHemingway1995` in `shared/references/references.json`
- [x] OCR CLI `python/src/scripts/usgs2131_ocr.py` + package `python/src/usgs_bulletin_2131/` (core 298/Cp tables PDF 10–76 + Priority-1 high-T + index; Modal/local via page-ocr)
- [x] Make: `usgs2131-ocr`, `usgs2131-ocr-smoke`, `usgs2131-build`, `usgs2131-verify`, `usgs2131-test` ([`scripts/make.d/15-usgs-bulletin-2131.mk`](../../scripts/make.d/15-usgs-bulletin-2131.mk)); spec [`USGS_BULLETIN_2131_SPEC.md`](../scripts/USGS_BULLETIN_2131_SPEC.md)
- [x] Robie staging = per-phase `robie-hemingway-1995/<phaseId>.json` at staging root (no compact `phases.json`; texts stay in tmp)
- [x] Generic mineral header + formula-next-line parser (`parse_tables.py` + `mineral_aliases.py`)
- [x] High-T table parse (`parse_high_t.py`) + complete `<phaseId>.json` at staging root
- [x] `make usgs2131-list-missing` / `usgs2131-ocr-missing` (skip pages that already have OCR)
- [x] `robieHemingway` equation type (backend method + compound-data overlay for `status: ok`)
- [x] Robie dataset build uses OCR `page-NNNN.txt` only; clears staging root/`compounds/` before rewrite; page-053.txt two-line Cp; single-A1 Cp (Gibbsite) accepted
- [ ] Cross-source gates / remaining Robie join cleanup beyond OCR-only

### Thermochemical staging from free Tier-1/2 sources (November 2026)

- [x] Sources under `shared/sources/minerals-thermodynamic/` (renamed from `thermodynamic/`; Abdul thesis, hp633ver.dat, Mao, Pankratz 672, Koroleva, Jung, Malan, Watanabe, Yazhenskikh workshops, Nagai ThermoML; USGS symlink)
- [x] Processed root `shared/processed/minerals-thermodynamic/` (renamed from `thermodynamic-staging/`) holds **`index.json` only** at root + per-source subfolders
- [x] **Universal contract:** every extracted source → `phases.json` only (calculable numbers + `ref` + `convention` + per-phase `status`); texts/OCR/raw in tmp — [`THERMOCHEMICAL_STAGING_SPEC.md`](../scripts/THERMOCHEMICAL_STAGING_SPEC.md)
- [x] Extractor `make thermodynamic-staging-extract` → HP633, Abdul, Robie, Koroleva, Malan, Watanabe, Jung Table 1, Nagai, Pankratz oxides, Mao scope
- [x] `hp633_parse.py` ingests **all** `EoS=` endmembers from `hp633ver.dat` (276), not a selected subset; `ENDMEMBER_MAP` only enriches known phase ids
- [x] Modal Surya OCR helpers: `thermodynamic-staging-ocr-jung` / `-pankratz` / `-mao` ([`16-thermodynamic-staging.mk`](../../scripts/make.d/16-thermodynamic-staging.mk))
- [x] Melt OCR catalog + runner: `ocr_jobs.py` + `thermodynamic_staging_ocr_run.py`; `make thermodynamic-staging-ocr-melt` / `-ocr-job` / `-ocr-yazhenskikh` / `-ocr-malan` / `-ocr-mao-papers` (skip existing dumps; Mao Papers I–V from `shared/sources/minerals-thermodynamic/mao-papers/`)
- [x] RefKeys `HollandPowell2011` … `Nagai2009`
- [x] Mao 2006 CAS paper (`mao-papers/Mao_2606.pdf`) + RefKey `Mao2006` + `mao_2006_cas_parse.py` → processed `mao-2006/phases.json` (Tables I/III **ok**; OCR dumps remain tmp `mao-2006-cas/`)
- [x] `mao-2005/` removed from processed (kappa thesis has no usable coeffs); only `mao-2006/` staged
- [x] Melt OCR batch complete (`yazhenskikh-2007/08/09`, `jung-2009`, `malan-2019`, `mao-2006-cas`, `abdul-2023-ccr` under `tmp/reports/python/minerals-thermodynamic/`)
- [x] Jung 2009 Table 1 MQM cleanup: parse full page-ocr (8 pages); Δg°/q0i match ISIJ Table 1 exactly (`jung_parse.py` + tests)
- [x] Koroleva 2017 Modal Surya OCR (10 pp) + `koroleva_parse.py` → silicate/borate Tables 1–2 + regression eqs (6)(7)(10)(11) in `koroleva-2017/phases.json`
- [x] OCR policy locked: [`OCR_POLICY.md`](../scripts/OCR_POLICY.md) — pdftotext/Tesseract = fast understanding (+ Tesseract for deep segmentation); Surya/`page-ocr` = final dataset OCR (linked from CONVENTIONS / AGENTS / staging specs)
- [x] Malan Table 3 from page-ocr → staging (quasichemical Δg Fe³⁺–Ti⁴⁺ + hematite/rutile/FPB SS); Yazhenskikh 07/08/09 OCR inventories → `partial` staging; RefKeys `Yazhenskikh2007`…`2009`
- [x] Abdul CCR Modal OCR complete (16 pp) + `abdul_ccr_parse.py` → tmp cross-check only (`phases.cross-check.json` under tmp); processed keeps sole `abdul-2023/` thesis TDB
- [ ] Drop remaining Mao Papers I–V into `mao-papers/` if needed
- [x] Minerals-thermodynamic → compound-data is part of `make compound-data-build` (no separate overlay target; `NO_MINERALS=1` to skip)
- [x] Phase-equilibrium **plan** updated: CALPHAD-estimate default on compound-data + eutectics + molten salts + glass; incomplete ionic liquid → documented fallbacks; digitized diagrams deferred; legacy eutectic/diagram kept for `compare` — [`FULL_PHASE_EQUILIBRIUM.md`](../algorithms/phase-equilibrium/FULL_PHASE_EQUILIBRIUM.md), legacy detail [`LEGACY_DIAGRAM_PHASE_EQUILIBRIUM.md`](../algorithms/phase-equilibrium/LEGACY_DIAGRAM_PHASE_EQUILIBRIUM.md)
- [x] Engine C v1 (CALPHAD estimate rungs 3–5) + `legacyEutectic` extracted; `POST /refractory/phase-equilibrium` takes `PhaseEquilibriumInputDto` (`algorithmMode` calphad/legacy/compare)
- [x] Abdul liquid `functions` map exported into `shared/processed/minerals-thermodynamic/abdul-2023/phases.json` (parser fix for `$ … FUNCTIONS` comments / `SIO2L0`); backend `AbdulExpression` + `AbdulLiquid` + CAS probe on Engine C (`calphad_partial_excess` when evaluable); frontend Chemical tab fractions + mode/compare
- [x] Engine C Gibbs minimisation: `CalphadGibbsMinimizer` (`nelderMead` + mass-balance penalty), `CALPHAD_CANDIDATE_SOLIDS` / liquid NASA end-members, `CompoundLiquidValue`, Mao `oxideG` probe (`MaoLiquid`); amounts from Gibbs when G data allow, else eutectic/Tm lever
- [x] CAS liquid excess ladder in Gibbs: Abdul associate speciation → Mao ionic P–Q → oxide Redlich–Kister (`CasLiquidExcess` / `AbdulAssociateSpeciation` / `MaoIonicSpeciation`)
- [x] Library XRD `mineralogy` for all mix components (`MATERIAL_MINERALOGY` + inline overrides, `PHASE_CATALOG`, `AmorphousRemainder`; consistency test)
- [x] Glass points wired through `MeltPropertyBundle` / response parts; Chemical tab shows unreacted-core and quenched-matrix glass points
- [x] Swagger response DTOs: `PhaseEquilibriumResultDto` (+ nested block/part/crystal/unreacted/matrix/metadata)
- [x] Chemical tab: refractoriness card / `/refractoriness` call removed (old oxide-effect + RUL scaling unreliable vs liquid % at T); use phase-equilibrium liquid sweep + η until L\*/viscosity cone estimate is wired
- [ ] Enable `legacyDiagram` after diagram validation; refractoriness from CALPHAD L(T)+η (see `REFRACTORINESS_ALGORITHM.md`)

### Source-extractor migration (November 2026)

- [x] SE FastAPI `/api/v1` + `/docs` + CLI `python -m source_extract.cli`
- [x] `SourceAdapter` registry (`SE_ADAPTER_MODULES` + entry points); host `phase_diagrams.adapter` / `yaws1999.adapter`
- [x] CommandSpec/ParamSpec; job runner; make `pd-*` → SE CLI; `extract_phase_diagram.py` shim
- [x] LLM client factory (Google/OpenAI/Anthropic/compatible) + call recorder; OCR region + assist tools
- [x] Dataset current/history + file `RunRecorder` + history commands; promote archives previous
- [x] Review spine + React GUI screens; nginx `/source-extractor/`; main-frontend nav link
- [x] Full port of diagram-review domain into `source_extract/review/` (split ≤300-line modules; adapter roots via `review_paths` / `SE_WORK_ROOT`)
- [x] Review REST: sessions, geometry edits, Analyze→JobRunner, confirm, guidance heuristics
- [x] React Review editor: systems+sessions rail, canvas engine (`view` pixels), tool modes, Analyze/Confirm/Undo (binary + ternary)
- [x] Unit tests: barycentric/retrace, draft resolve prefers rich candidate, binary axes, move/undo
- [ ] §12 cutover gate remaining: Analyze+reload in GUI end-to-end, NBS-backed extract, OCR zone re-query, LLM proposal apply, history diff
- [ ] Delete host `phase_diagrams/cli` handlers and local diagram-review after cutover

Plan: [`docs/plans/SOURCE_EXTRACTOR_MIGRATION.md`](../plans/SOURCE_EXTRACTOR_MIGRATION.md).

### Ops / Nginx SSL (November 2026)

- [x] `scripts/install-ssl-certs.sh` — issue / install / renew Let's Encrypt (Docker certbot) into `docker/nginx/ssl/{cert,key}.pem`; make targets `install-ssl-certs` / `renew-ssl-certs`; docs [`nginx-ssl-workflow-and-ops.md`](../nginx-ssl-workflow-and-ops.md)
- [x] `scripts/sync-vendor-env.sh` — pure bash (no host Python) so `make setup` matches Docker-first policy
- [x] Make targets use Compose V2 plugin (`docker compose`) — no standalone `docker-compose` binary
- [x] Unblocked tracking of `phase-equilibrium-{calphad,legacy-eutectic,legacy-diagram}.service.ts` (local `.git/info/exclude` had a bad `services/` rule that hid them from commits)
- [x] Vite `allowedHosts` from `VITE_ALLOWED_HOSTS` (main frontend + source-extractor-ui; compose + env examples)
- [x] Source Extractor UI back link to main app (`VITE_MAIN_APP_URL`)
- [x] Home page: Materials/Processes section cards (icons + descriptions) link to hub sections; labels aligned with Processes hub (e.g. Multilayer wall, Thermal distribution)
- [x] Nginx HTTPS enabled (`listen 443` + HTTP→HTTPS redirect); shared `app-locations.inc`; `make ssl-self-signed` for local certs
- [x] `.env.production.example` for thermosolver.net (HTTPS); `make setup-production` copies it to `.env`
- [x] Nginx entrypoint selects HTTP-only vs HTTPS from cert presence (no crash when `ssl/cert.pem` missing)
- [x] `compose.production.yml` aligned with `compose.yml`: source-extractor + UI, SE env/volumes, nginx depends_on, OCR caches

---

*Update this file as progress is made.*
