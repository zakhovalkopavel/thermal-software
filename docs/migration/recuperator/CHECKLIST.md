# Recuperator Migration — Implementation Checklist

Track each item with `[x]` when done.

---

## PHASE 1 — Shared thermal library (`backend/src/common/thermal/`)

### Interfaces & DTOs
- [ ] Copy `interface/compoundValue.ts` → `compound-value.interface.ts`
- [ ] Copy `interface/composition.ts` → `composition.interface.ts`
- [ ] Copy `interface/equationValue.ts` → `equation-value.interface.ts`
- [ ] Copy `interface/equation.ts` → `equation.interface.ts`
- [ ] Copy `interface/fluid.ts` → `fluid.interface.ts`
- [ ] Copy `interface/materialValue.ts` → `material-value.interface.ts`
- [ ] Copy `interface/chemicalComposition.ts` → `chemical-composition.interface.ts`
- [ ] Copy `dto/equationType.dto.ts`
- [ ] Copy `dto/chemicalCompounds.dto.ts`
- [ ] Copy `dto/thermalConductivityEquationType.dto.ts`

### Utils & equation methods
- [ ] Copy `utils/common.ts`
- [ ] Copy all `utils/*EquationMethod.ts` (9 files)
- [ ] Copy all `type/*Equation.ts` (9 files)
- [ ] Create `utils/temperature.utils.ts` (celsiusFromKelvin / kelvinFromCelsius)
- [ ] Create `utils/equation-methods.ts` (re-export barrel)

### Gas compounds
- [ ] Copy `compound/gas/air.ts` — add `// TODO: populate viscosity.values`
- [ ] Copy `compound/gas/n2.ts`
- [ ] Copy `compound/gas/o2.ts`
- [ ] Copy `compound/gas/co2.ts`
- [ ] Copy `compound/gas/co.ts`
- [ ] Copy `compound/gas/h2o.ts`
- [ ] Copy `compound/gas/h2.ts`
- [ ] Copy `compound/gas/ch4.ts`
- [ ] Copy `compound/gas/nh3.ts`
- [ ] Create `compound/gas/index.ts` (barrel export)

### Fluid condition classes
- [ ] Copy `fluidConditionCompound.ts`
- [ ] Copy `fluidDynamics.ts`
- [ ] Fix `gasComposition.ts`: constructor `molPartial` init, rewrite `heatCapacity` using compound objects, remove `gasValues`/`tValidCMin`/`tValidCMax`
- [ ] Implement minimum viable `fluidConditionComposition.ts` stubs

---

## PHASE 2 — Module scaffolding

- [ ] Create enums: `hole-form.enum.ts`
- [ ] Create enums: `furnace-form.enum.ts`
- [ ] Create enums: `material-type.enum.ts` (21 values)
- [ ] Create `data/materials/recuperator-material.interface.ts`

---

## PHASE 3 — Material data objects (21 files)

- [ ] `chamotte-solid.data.ts`
- [ ] `chamotte-1300.data.ts`
- [ ] `chamotte-1000.data.ts`
- [ ] `chamotte-900.data.ts`
- [ ] `chamotte-600.data.ts`
- [ ] `chamotte-400.data.ts`
- [ ] `mullite-2300.data.ts`
- [ ] `quartz-2000.data.ts`
- [ ] `quartz-1000.data.ts`
- [ ] `quartz-sand-1.data.ts`
- [ ] `quartz-sand-05.data.ts`
- [ ] `quartz-sand-02.data.ts`
- [ ] `alumina-2500.data.ts`
- [ ] `alumina-1300.data.ts`
- [ ] `alumina-sand-1.data.ts`
- [ ] `alumina-sand-05.data.ts`
- [ ] `alumina-sand-02.data.ts`
- [ ] `silicon-carbide.data.ts`
- [ ] `basalt-fiber-mat.data.ts`
- [ ] `aisi-304.data.ts`
- [ ] `mild-steel.data.ts`

---

## PHASE 4 — Services (leaf → root)

- [ ] `AirPropertiesService` — thermophysical properties + Nusselt correlations
- [ ] `GasCompositionService` — mixture heat capacity via compound objects
- [ ] `RadiationService` — Hottel correlation, radiation alpha
- [ ] `GeometryService` — channel and furnace geometry
- [ ] `MaterialService` — `getLambda` / `getEmissivity` via data map
- [ ] `ThermalInsulationService` — outer surface temp iteration
- [ ] `HeatTransferService` — `calculateSurface`, `fullGasAlpha`, composite wall
- [ ] `FurnaceService` — single-layer and multi-layer flux; fix `step` parameter bug
- [ ] `RecuperatorOptimizerService` — 8-neighbor grid search, energy balance

---

## PHASE 5 — DTOs & Controller

- [ ] `CombustionProductsDto` stub in `CombustionModule` (or shared DTO)
- [ ] `FurnaceLayerDto`
- [ ] `RecuperatorInputDto` with class-validator decorators
- [ ] `RecuperatorResultDto`
- [ ] `RecuperatorController` — `POST /recuperator/calculate`
- [ ] `RecuperatorModule` — wire providers + import `CombustionModule`
- [ ] Update `AppModule` imports

---

## PHASE 6 — Tests

- [ ] `air-properties.service.spec.ts`
- [ ] `gas-composition.service.spec.ts`
- [ ] `radiation.service.spec.ts`
- [ ] `geometry.service.spec.ts`
- [ ] `material.service.spec.ts`
- [ ] `heat-transfer.service.spec.ts`
- [ ] `furnace.service.spec.ts`
- [ ] `recuperator-optimizer.integration.spec.ts`

---

## PHASE 7 — Cleanup

- [ ] Delete `legacy/scripts/recuperator.js` references from any import paths
- [ ] Verify no `console.log` in migrated files (replace with NestJS `Logger`)
- [ ] Remove dev-only `GET /recuperator/test-data` endpoint before release
- [ ] Add `Air.viscosity.values` data when source data is available
- [ ] Implement Wilke mixing rules in `FluidConditionComposition` (deferred)
- [ ] Port deferred functions: `calculateOptimalCoaxialTube`, `calculateFuelBurnLayer` (separate ticket)

