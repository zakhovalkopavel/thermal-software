# Implementation Status

**Last Updated:** September 2026
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
| **Metals** | 100% | `backend/src/modules/metals/` — MetalThermalService (AISI 304, mild steel); `GET /metals/list`; numeric `T_K` query fix |
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
- [x] `blend-optimizer.interface.ts`
- [x] `component-property.interface.ts`
- [x] `glass-viscosity.interface.ts`
- [x] `mineral-phase.interface.ts`
- [x] `packing-calculator.interface.ts`
- [x] `phase-equilibrium.interface.ts`
- [x] `psd-calculator.interface.ts`
- [x] `refractoriness.interface.ts`
- [x] `shrinkage-calculator.interface.ts`
- [x] `thermal-performance.interface.ts`
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
- [x] `known-fluid.type.ts` — single source of truth for fluid keys
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
- [x] `enums/metal-material.enum.ts` — AISI_304, MILD_STEEL
- [x] `data/interfaces/metal-thermal.interface.ts` — `MetalThermalEntry`, λ `tempUnit` flag (K vs °C)
- [x] `data/materials/metal-thermal.data.ts` — `METAL_THERMAL_MATERIALS[]` + `METAL_THERMAL_MAP`
- [x] `services/metal-thermal.service.ts` — pure computation (no hardcoded values)
- [x] `dto/metal-thermal-query.dto.ts`, `metal-thermal-result.dto.ts`
- [x] `controllers/metals.controller.ts` → `GET /metals/thermal-properties`

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
- Simpson's rule moved to `common/utils/simpson.util.ts` (`simpson`, re-exported from `quadrature.util.ts`); the two local copies in `series-bc3.util.ts` and `series-hollow-bc3.util.ts` removed. Results unchanged.

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

### Medium priority

4. **Transport / aerodynamics services** — thin implementations (40-78 lines), likely incomplete
5. **Recuperator module** — start after ThermodynamicsModule is stable; spec in [`recuperator/`](recuperator/)
6. **Combustion module** — Stage C per [`ROADMAP.md`](ROADMAP.md); spec in [`combustion/`](combustion/)
7. **Furnace module** — start Stage B per [`ROADMAP.md`](ROADMAP.md)
8. **Database migrations** — required before any persistent data features

---

*Update this file as progress is made.*
