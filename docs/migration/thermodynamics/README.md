# Thermodynamics Module Migration — Document Index

**Sources:**
- `legacy/scripts/src/thermalExchange/gasComposition.ts` — polynomial Cp for gas mixtures
- `legacy/scripts/src/thermalExchange/fluidConditionComposition.ts` — mixture transport stubs
- `legacy/furnaceCombustion/classes/Thermodynamics.js` — NASA-7 Cp/H/S/G
- `legacy/furnaceCombustion/classes/TransportProperties.js` — Sutherland viscosity + Wilke mixing
- `legacy/furnaceCombustion/classes/DiffusionCoefficients.js` — Chapman-Enskog diffusion
- `legacy/furnaceCombustion/classes/GasProperties.js` — aggregator facade
- `legacy/furnaceCombustion/modules/HeatTransfer.js` — Gunn correlation, packed-bed, natural convection
- `legacy/furnaceCombustion/modules/Aerodynamics.js` — flow, pressure drop

**Target:** `backend/src/modules/thermodynamics/`  
**Status:** Planning — March 2026

---

## Chapters

| File | Contents |
|---|---|
| [CH01_SCOPE.md](CH01_SCOPE.md) | What belongs here; boundary with combustion and recuperator |
| [CH02_FILE_STRUCTURE.md](CH02_FILE_STRUCTURE.md) | Target directory layout |
| [CH03_SERVICE_DECOMPOSITION.md](CH03_SERVICE_DECOMPOSITION.md) | Per-service interfaces, sources, overlap analysis |
| [CH04_CP_RESOLUTION.md](CH04_CP_RESOLUTION.md) | Unified equation framework; NASA-7 as EquationTypeDto variant |
| [CH05_DTOS.md](CH05_DTOS.md) | Input/output DTOs |
| [CH06_NESTJS_REGISTRATION.md](CH06_NESTJS_REGISTRATION.md) | Module wiring |
| [CH07_DIMENSIONLESS_NUMBERS.md](CH07_DIMENSIONLESS_NUMBERS.md) | Re, Pr, Nu, Gr, Ra — all geometries, API endpoint |
| [CHECKLIST.md](CHECKLIST.md) | Task-by-task implementation checklist |

