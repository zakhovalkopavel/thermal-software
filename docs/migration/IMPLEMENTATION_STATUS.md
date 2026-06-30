# Implementation Status

**Last Updated:** May 2026
**Overall Progress:** ~35%

> ⚠️ **Maintenance rule:** This file must be updated in the **same commit** as any change
> to a service, test file, or documentation entry. A PR that changes code without updating
> this file is considered incomplete. See [docs/CONVENTIONS.md — Definition of Done](../CONVENTIONS.md).

---

## Summary

| Module | Progress | Notes |
|--------|----------|-------|
| **Refractory** | ~80% | All 11 services implemented; tests partially complete |
| **Thermodynamics** | ~55% | All 8 services + 3 controllers implemented; tests partial |
| **Common thermal library** | ~70% | 16 gas compounds, composition, numeric utils |
| **Frontend** | ~2% | Skeleton only — no pages or components yet |
| **Furnace** | 0% | Not started |
| **Recuperator** | 0% | Not started — spec in `docs/migration/recuperator/` |
| **Combustion** | 0% | Not started — spec in `docs/migration/combustion/` |
| **Thermal Distribution** | 0% | Not started — algorithm spec in `docs/algorithms/thermal-distribution/` |
| **Thermophysical** | 0% | Not started |
| **Database migrations** | 0% | Not started |
| **E2E tests** | 0% | Not started |

---

## Refractory Module — ~80%

**Base path:** `backend/src/modules/refractory/`

### Structure
- [x] `refractory.module.ts`
- [x] `refractory.controller.ts`

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

## Recuperator Module — 0%

**Target path:** `backend/src/modules/recuperator/`

- [ ] Module structure
- [ ] Heat exchanger service
- [ ] Effectiveness-NTU service
- [ ] Pressure drop service

Spec: [`docs/migration/recuperator/`](recuperator/) (12 chapters: scope, file structure, service decomposition, DTOs, controller, material data, testing, registration, implementation order)

---

## Combustion Module — 0%

**Target path:** `backend/src/modules/combustion/`

- [ ] Module structure
- [ ] Flame temperature service
- [ ] Combustion products service
- [ ] Chemical kinetics service
- [ ] Layer model service

Spec: [`docs/migration/combustion/`](combustion/) (10 chapters: scope, file structure, service decomposition, chemical kinetics, thermodynamics, transport, DTOs, registration)

---

## Thermal Distribution Module — 0%

**Target path:** `backend/src/modules/thermal-distribution/`

- [ ] Module structure (not yet started)
- [ ] Volume-average temperature
- [ ] API design

Algorithm spec: [`docs/algorithms/thermal-distribution/`](../algorithms/thermal-distribution/) (12 spec files covering geometries, methods, API, calibration, validation, examples)

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
