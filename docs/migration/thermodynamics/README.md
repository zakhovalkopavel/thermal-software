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
| [CH07_DIMENSIONLESS_NUMBERS.md](CH07_DIMENSIONLESS_NUMBERS.md) | Re, Pr, Nu, Gr, Ra — two modes, service interface, CorrelationName catalog (names only), NusseltParams/Result, selector logic, controller, tests |
| [CH07_APPENDIX_A_INTERNAL_FLOW.md](CH07_APPENDIX_A_INTERNAL_FLOW.md) | Pipe/duct/helical/corrugated correlations — Mills, Gnielinski, Dittus-Boelter, Mikheev, Petukhov, Whitaker, Churchill friction factor; full formulas + legacy source links |
| [CH07_APPENDIX_B_PLATES.md](CH07_APPENDIX_B_PLATES.md) | Flat plate, vertical plate/cylinder, horizontal plate, inclined plate — Blasius, Churchill-Ozoe, Churchill-Chu (1975a), McAdams, Whitaker; legacy source links |
| [CH07_APPENDIX_C_CYLINDERS.md](CH07_APPENDIX_C_CYLINDERS.md) | Cylinder crossflow, horizontal cylinder, concentric cylinders — Churchill-Bernstein, Hilpert, Churchill-Chu (1975b), Whitaker, Raithby-Hollands |
| [CH07_APPENDIX_D_SPHERES.md](CH07_APPENDIX_D_SPHERES.md) | Sphere forced/natural, concentric spheres — Ranz-Marshall, diffusion form, Whitaker, Churchill sphere; legacy source links |
| [CH07_APPENDIX_E_SPECIAL.md](CH07_APPENDIX_E_SPECIAL.md) | Tube banks, cavities, mixed convection, packed bed, phase change, rotating, impinging jets — Zukauskas, Hollands, Churchill blend, Gunn, Wakao-Funazkri, Whitaker, Martin; legacy source links |
| [CH08_GEOMETRY.md](CH08_GEOMETRY.md) | `FlowGeometry`, `BodyGeometry`, `GeometryDims`, `KnownFluid`, hydraulic diameter table, surface/volume/beam-length formulas |
| [CHECKLIST.md](CHECKLIST.md) | Task-by-task implementation checklist |
| [CHECKLIST.md](CHECKLIST.md) | Task-by-task implementation checklist |

