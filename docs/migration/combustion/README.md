# Combustion Module Migration — Document Index

**Sources:**
- `legacy/scripts/recuperator.js` — `CombustionService` logic (lines ~575–680)
- `legacy/furnaceCombustion/modules/ChemicalKinetics.js` — Arrhenius rates
- `legacy/furnaceCombustion/modules/EquilibriumSolver.js` — Gibbs minimiser
- `legacy/furnaceCombustion/furnace_combustion_model.js` — layer-by-layer model
- `legacy/furnaceCombustion/classes/FuelDatabase.js` — fuel data

> `Thermodynamics.js`, `TransportProperties.js`, `DiffusionCoefficients.js`, `HeatTransfer.js`, `Aerodynamics.js`  
> → **moved to `ThermodynamicsModule`** — see `docs/migration/thermodynamics/`

**Target:** `backend/src/modules/combustion/`  
**Status:** Planning — March 2026

---

## Chapters

| File | Contents |
|---|---|
| [CH01_SCOPE.md](CH01_SCOPE.md) | Module boundaries, what belongs here vs recuperator |
| [CH02_FILE_STRUCTURE.md](CH02_FILE_STRUCTURE.md) | Target directory layout |
| [CH03_SERVICE_DECOMPOSITION.md](CH03_SERVICE_DECOMPOSITION.md) | Per-service interfaces and sources |
| [CH04_CHEMICAL_KINETICS.md](CH04_CHEMICAL_KINETICS.md) | Kinetics classes from `furnaceCombustion/modules/` |
| [CH05_THERMODYNAMICS.md](CH05_THERMODYNAMICS.md) | → redirect to `thermodynamics/` — NASA-7 moved there |
| [CH06_TRANSPORT.md](CH06_TRANSPORT.md) | → redirect to `thermodynamics/` — transport/diffusion moved there |
| [CH07_DTOS.md](CH07_DTOS.md) | Input/output DTOs including `CombustionProductsDto` |
| [CH08_NESTJS_REGISTRATION.md](CH08_NESTJS_REGISTRATION.md) | Module wiring |
| [CHECKLIST.md](CHECKLIST.md) | Task-by-task implementation checklist |

---

## Boundary rule

> This module owns all **chemistry and reaction kinetics**.  
> Heat transfer, gas flow, and surface temperatures live in `recuperator` or `heat-transfer` modules.  
> Gas thermophysical properties (Cp, λ, μ) are sourced from `backend/src/common/thermal/` — no duplication.

