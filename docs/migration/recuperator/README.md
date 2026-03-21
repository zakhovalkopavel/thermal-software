# Recuperator Migration — Document Index

**Source:** `legacy/scripts/recuperator.js`, `legacy/scripts/src/`  
**Target:** `backend/src/modules/recuperator/`, `backend/src/common/thermal/`  
**Status:** Planning — March 2026

---

## Chapters

| File | Contents |
|---|---|
| [CH01_FILE_STRUCTURE.md](CH01_FILE_STRUCTURE.md) | Target directory layout, shared library layout |
| [CH02_SHARED_LIBRARY.md](CH02_SHARED_LIBRARY.md) | Status of every `legacy/scripts/src/` file |
| [CH03_SERVICE_DECOMPOSITION.md](CH03_SERVICE_DECOMPOSITION.md) | Per-service interfaces, sources, formulas |
| [CH04_DTOS.md](CH04_DTOS.md) | Input/output DTO definitions |
| [CH05_CONTROLLER.md](CH05_CONTROLLER.md) | NestJS controller and endpoint design |
| [CH06_MATERIAL_DATA.md](CH06_MATERIAL_DATA.md) | 21 material data objects, formula table |
| [CH07_INCOMPLETE_FIXES.md](CH07_INCOMPLETE_FIXES.md) | Specific fixes for incomplete legacy files |
| [CH08_TESTING.md](CH08_TESTING.md) | Unit and integration test plan |
| [CH09_NESTJS_REGISTRATION.md](CH09_NESTJS_REGISTRATION.md) | Module wiring, AppModule update |
| [CH10_IMPLEMENTATION_ORDER.md](CH10_IMPLEMENTATION_ORDER.md) | Dependency-safe implementation sequence |
| [CHECKLIST.md](CHECKLIST.md) | Task-by-task implementation checklist |

---

## Scope boundary

This spec covers **heat transfer and gas properties** only.  
Combustion chemistry, chemical kinetics, and flame modelling live in a separate module — see `docs/migration/combustion/`.

