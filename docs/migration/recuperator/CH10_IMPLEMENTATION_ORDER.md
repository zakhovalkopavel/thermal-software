# CH10 — Implementation Order

Dependency-safe sequence. Each step can start only after all steps it depends on are complete.

**External prerequisites** (outside this module — must be done first):
- `ThermodynamicsModule` PHASE 1–7 → provides `GasPropertiesService`, `HeatTransferCorrelationsService`
- `CombustionModule` PHASE 1–2 → provides `CombustionService` + `CombustionProductsDto`

| Step | Task | Depends on |
|---|---|---|
| 1 | Copy `interface/`, `dto/`, `utils/`, `type/` → `backend/src/common/thermal/` | — |
| 2 | Copy gas compound files (`air`, `n2`…`nh3`) → `common/thermal/compound/gas/` | 1 |
| 3 | Copy `fluidConditionCompound.ts`, `fluidDynamics.ts` → `common/thermal/fluid-condition/` | 1, 2 |
| 4 | Fix `gasComposition.ts` constructor + `heatCapacity`; move to `fluid-condition/` | 2, 3 |
| 5 | Stub `fluidConditionComposition.ts` minimum viable bodies | 3, 4 |
| 6 | Create enums: `HoleForm`, `FurnaceForm`, `MaterialType` | — |
| 7 | Create `RecuperatorMaterialData` interface + all 21 `*.data.ts` files | 6 |
| 8 | Implement `AirPropertiesService` | 1, 2, 3 |
| 9 | Implement `GasCompositionService` | 1, 2, 3, 4 |
| 10 | Implement `RadiationService` | — |
| 11 | Implement `GeometryService` | 6 |
| 12 | Implement `MaterialService` | 6, 7 |
| 13 | Implement `ThermalInsulationService` | 8, **ThermodynamicsModule** |
| 14 | Implement `HeatTransferService` | 8, 10, **ThermodynamicsModule** |
| 15 | Implement `FurnaceService` | 8, 11, 12, 14 |
| 16 | `CombustionProductsDto` available from `CombustionModule` | **CombustionModule PHASE 2** |
| 17 | Define `RecuperatorInputDto`, `FurnaceLayerDto`, `RecuperatorResultDto` | 6, 16 |
| 18 | Implement `RecuperatorOptimizerService` | 8–15, 17, **CombustionModule** |
| 19 | Implement `RecuperatorController` | 17, 18 |
| 20 | Wire `RecuperatorModule` (import `ThermodynamicsModule` + `CombustionModule`), update `AppModule` | all above |
| 21 | Unit tests per service | per service |
| 22 | Integration test for optimizer | 20 |
