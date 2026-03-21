# Combustion Module — Implementation Checklist

Track each item with `[x]` when done.  
**Prerequisites:**
- `common/thermal` shared library (recuperator PHASE 1) complete
- `ThermodynamicsModule` PHASE 2–4 complete (NASA-7, Transport, Diffusion)

---

## PHASE 1 — Scaffolding

- [ ] Create `backend/src/modules/combustion/` directory structure (see CH02)
- [ ] Create `fuel-type.enum.ts`
- [ ] Create `fuel.interface.ts`
- [ ] Create `charcoal-briquette.data.ts`
- [ ] Create `natural-gas.data.ts`

---

## PHASE 2 — Core combustion (from `recuperator.js`)

- [ ] `CombustionService.getCombustionProducts()` — mass fractions from `k`, `wH2Om`
- [ ] `CombustionService.findMaxFlameTemperature()` — iterative energy balance using `GasPropertiesService`
- [ ] `CombustionService.systemEnergyChange()` — enthalpy change helper
- [ ] `CombustionProductsDto` — exported DTO consumed by RecuperatorModule
- [ ] `CombustionInputDto`, `FlameCalcParamsDto`
- [ ] Unit tests: flame temp at k=1.3; sub-stoichiometric k=0.8; energy balance

---

## PHASE 3 — Chemical kinetics

- [ ] `ChemicalKineticsService.rate(reaction, T, concentrations)` — Arrhenius
- [ ] Implement 5 reactions (C+O2, Boudouard, CO+O2, steam gasification, WGS)
- [ ] Wire diffusion efficiency `η` via `DiffusionService` from `ThermodynamicsModule`
- [ ] Cross-check A, Ea, n values against NIST Kinetics Database
- [ ] Unit tests: rate sign, temperature sensitivity, Thiele modulus η

---

## PHASE 4 — Equilibrium solver

- [ ] `EquilibriumService` — Gibbs minimisation using `Nasa7Service.g()` from `ThermodynamicsModule`
- [ ] Unit tests (can stub initially)

---

## PHASE 5 — Layer-by-layer furnace model

- [ ] `FurnaceCombustionService` — migrate `furnace_combustion_model.js`
- [ ] `LayerCombustionResultDto`
- [ ] Replace `HeatTransfer.js` calls with `HeatTransferCorrelationsService` from `ThermodynamicsModule`
- [ ] Replace `Aerodynamics.js` calls with `AerodynamicsService` from `ThermodynamicsModule`
- [ ] Integration test: cylindrical furnace, charcoal briquettes, default params

---

## PHASE 6 — Controller & registration

- [ ] `CombustionController` — `POST /combustion/calculate`
- [ ] `CombustionModule` — imports `ThermodynamicsModule` (see CH08)
- [ ] Update `AppModule`

---

## PHASE 7 — Cleanup

- [ ] No `console.log` — replace with NestJS `Logger`
- [ ] All kinetics parameters cite source reference
- [ ] Update `docs/migration/IMPLEMENTATION_STATUS.md`
