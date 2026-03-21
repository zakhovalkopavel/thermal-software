# Legacy Code Migration — Master Index

**Updated:** March 21, 2026  
**Status:** Planning Phase — module architecture decided  
**Primary reference:** [ROADMAP.md](ROADMAP.md) · [MODULE_ARCHITECTURE.md](MODULE_ARCHITECTURE.md)

---

## Active spec folders (current)

| Module | Spec folder | Checklist |
|---|---|---|
| Shared thermal library | recuperator/ PHASE 1 | [recuperator/CHECKLIST.md](recuperator/CHECKLIST.md) |
| `ThermodynamicsModule` | [thermodynamics/](thermodynamics/) | [thermodynamics/CHECKLIST.md](thermodynamics/CHECKLIST.md) |
| `RecuperatorModule` | [recuperator/](recuperator/) | [recuperator/CHECKLIST.md](recuperator/CHECKLIST.md) |
| `CombustionModule` | [combustion/](combustion/) | [combustion/CHECKLIST.md](combustion/CHECKLIST.md) |
| `ThermophysicalModule` + Python | [thermophysical-library/](thermophysical-library/) | [thermophysical-library/CHECKLIST.md](thermophysical-library/CHECKLIST.md) |
| `RefractoryModule` | [STEP_01_REFRACTORY_MODULE.md](STEP_01_REFRACTORY_MODULE.md) | [MIGRATION_CHECKLIST.md](MIGRATION_CHECKLIST.md) |

---

## Legacy STEP files (pre-March 2026 — partially superseded)

These files predate the module architecture decision. Some content is still valid; consult the active spec folders above for the authoritative version.

- [STEP_01_REFRACTORY_MODULE.md](STEP_01_REFRACTORY_MODULE.md)
- [STEP_02_FURNACE_MODULE.md](STEP_02_FURNACE_MODULE.md) — superseded by `combustion/` + `thermodynamics/`
- [STEP_03_THERMOPHYSICAL_MODULE.md](STEP_03_THERMOPHYSICAL_MODULE.md) — superseded by `thermophysical-library/`
- [STEP_04_FRONTEND_PAGES.md](STEP_04_FRONTEND_PAGES.md)
- [STEP_05_DATABASE_MIGRATION.md](STEP_05_DATABASE_MIGRATION.md) — see `thermophysical-library/CH04_DB_MIGRATION.md`
- [STEP_06_TESTING.md](STEP_06_TESTING.md)

---

## Legacy → New mapping (updated)

```
legacy/scripts/src/                → backend/src/common/thermal/          (shared library)
legacy/furnaceCombustion/classes/  → backend/src/modules/thermodynamics/  (NASA-7, Sutherland, Chapman-Enskog)
legacy/furnaceCombustion/modules/  → thermodynamics/ (HeatTransfer, Aerodynamics)
                                     combustion/      (ChemicalKinetics, EquilibriumSolver)
legacy/furnaceCombustion/furnace_combustion_model.js → combustion/FurnaceCombustionService
legacy/scripts/recuperator.js      → combustion/ (lines ~575–680)
                                     recuperator/ (all other sections)
legacy/refractory/                 → backend/src/modules/refractory/
legacy/library/processed_data/     → shared/processed/ (CSV now) → DB (future)
legacy/python_scripts/             → python/src/thermophysical/
```

---

## Implementation order

See [ROADMAP.md](ROADMAP.md) for the full dependency graph and stage breakdown.

```
Stage A:  common/thermal shared library
Stage B:  ThermodynamicsModule
Stage C:  RecuperatorModule + CombustionModule core + ThermophysicalModule
Stage D:  CombustionModule kinetics/layer model + DB migration
```

---

## Progress tracking

- [IMPLEMENTATION_STATUS.md](IMPLEMENTATION_STATUS.md) — overall status
- [MIGRATION_CHECKLIST.md](MIGRATION_CHECKLIST.md) — legacy checklist (pre-March 2026)
