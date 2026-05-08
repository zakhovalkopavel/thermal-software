# Migration Documentation

**Updated:** March 21, 2026  
**Status:** Module architecture decided — active planning

---

## Start here

- **[ROADMAP.md](ROADMAP.md)** — dependency graph, implementation stages
- **[MODULE_ARCHITECTURE.md](MODULE_ARCHITECTURE.md)** — module boundaries, ownership table, Cp resolution
- **[MIGRATION_INDEX.md](MIGRATION_INDEX.md)** — full file index with status

---

## Active spec folders

| Module | Folder |
|---|---|
| Shared thermal library + `RecuperatorModule` | [recuperator/](recuperator/) |
| `ThermodynamicsModule` | [thermodynamics/](thermodynamics/) |
| `CombustionModule` | [combustion/](combustion/) |
| `ThermophysicalModule` + Python service | [thermophysical-library/](thermophysical-library/) |

---

## Legacy documents (pre-March 2026)

Still valid for refractory and frontend; superseded for combustion/thermodynamics/thermophysical:

- [STEP_01_REFRACTORY_MODULE.md](STEP_01_REFRACTORY_MODULE.md)
- [STEP_02_FURNACE_MODULE.md](STEP_02_FURNACE_MODULE.md) ⚠️ superseded
- [STEP_03_THERMOPHYSICAL_MODULE.md](STEP_03_THERMOPHYSICAL_MODULE.md) ⚠️ superseded
- [STEP_04_FRONTEND_PAGES.md](STEP_04_FRONTEND_PAGES.md)
- [STEP_05_DATABASE_MIGRATION.md](STEP_05_DATABASE_MIGRATION.md)
- [STEP_06_TESTING.md](STEP_06_TESTING.md)
- [IMPLEMENTATION_STATUS.md](IMPLEMENTATION_STATUS.md)
- [MIGRATION_CHECKLIST.md](MIGRATION_CHECKLIST.md)
- [ARCHITECTURE_COMPARISON.md](ARCHITECTURE_COMPARISON.md)
- [NESTJS_QUICK_START.md](NESTJS_QUICK_START.md)
- [DOCKER_FIRST_SETUP.md](DOCKER_FIRST_SETUP.md)
