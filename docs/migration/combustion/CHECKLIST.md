# Combustion Module — Implementation Checklist

Track each item with `[x]` when done.  
**Prerequisites:**
- `common/thermal` shared library (recuperator PHASE 1) complete
- `ThermodynamicsModule` PHASE 2–4 complete (NASA-7, Transport, Diffusion)

Algorithms as implemented: [`docs/algorithms/combustion/`](../../algorithms/combustion/README.md).
The implementation differs from the original chapters CH03–CH08 where noted below.

---

## PHASE 1 — Scaffolding

- [x] `backend/src/modules/combustion/` structure (`data/fuels/`, `enums/`, `interfaces/`, `utils/`, `services/`, `dto/`)
- [x] `enums/fuel-id.enum.ts`, `enums/combustion-mode.enum.ts` (instead of `fuel-type.enum.ts`)
- [x] `data/fuels/fuel.interface.ts`
- [x] `charcoal-briquette.data.ts`, `charcoal-oak.data.ts` — verbatim from `FuelDatabase.js`
- [x] ~~`carbon-equivalent.data.ts`~~ — removed; the recuperator selects a combustion mode
- [ ] `natural-gas.data.ts` — replaced by mode 3 `fuelGas` mole fractions; named gas presets come with the extra gases

---

## PHASE 2 — Core combustion (from `recuperator.js`)

- [x] Absolute enthalpy (`GasPropertiesService.absoluteEnthalpy`, NASA-7) — replaces `systemEnergyChange()`
- [x] `ProductEquilibriumService` — element balance + WGS Kp(T) — replaces `getCombustionProducts()`
- [x] `FlameSolverService` — brentq energy balance — replaces `findMaxFlameTemperature()`
- [x] `CombustionService.flueGas()` — flue gas of the mode selected by the recuperator (`CombustionModeInputDto`); legacy `calculate()` / `POST /combustion/calculate` removed
- [x] Unit tests: flame temperature at k = 1.1/1.3, sub-stoichiometric k = 0.8, energy and element balances

---

## PHASE 3 — Chemical kinetics

- [x] `ChemicalKineticsService` — Arrhenius, surface rates r1–r33, gas-phase r4–r43, heat release
- [x] Diffusion effectiveness η (Thiele) with `DiffusionService.effectiveDiffusion`
- [ ] Cross-check A, Ea, n values against NIST Kinetics Database (legacy values kept verbatim)
- [x] Unit tests: rate sign, temperature sensitivity, Thiele modulus η, WGS equilibrium

---

## PHASE 4 — Equilibrium solver

- [x] Water-gas shift equilibrium with NASA-7 Gibbs energies (Gibbs minimisation not needed for the product set)
- [x] Unit tests

---

## PHASE 5 — Layer-by-layer furnace model

- [x] `BedCombustionService` — migrates `furnace_combustion_model.js` (molar flows, absolute-enthalpy balance)
- [x] `BedCombustionInputDto`, `BedLayerResultDto`, `BedCombustionResultDto`
- [x] Gunn Nu (`specialNu.gunn`), `AerodynamicsService` (Ergun), `TransportService`
- [x] Wall losses via `MultilayerWallService` (generator and furnace)
- [x] Unit/integration tests: charcoal briquettes, default geometry, walls, steam, burnout

---

## PHASE 6 — Controller & registration

- [x] `CombustionController` — `POST /combustion/solid/direct`, `/solid/two-step`, `/fluid`, `/bed`, `GET /combustion/fuels`
- [x] `CombustionModule` — imports `ThermodynamicsModule`, `ThermalExchangeModule`
- [x] `AppModule` registration

---

## PHASE 7 — Cleanup

- [x] No `console.log`
- [x] Kinetics parameters cite source reference (`BED_KINETICS`)
- [x] Update `docs/migration/IMPLEMENTATION_STATUS.md`

---

## PHASE 8 — Extra gases

- [x] Compounds C2H6, C3H8, C4H10, iC4H10, C2H2, C3H4, aC3H4, C3H6 (NASA-7 from `json/NASA/nasa7.json`, heat capacity, Sutherland, Eucken conductivity)
- [x] `Species` enum + `GAS_REGISTRY` entries
- [x] MAP-gas preset `map-pro` + `fuelId` on `POST /combustion/fluid` (composition to be confirmed)
- [x] Tests `fuel-gases.spec.ts` (LHV, isomers, viscosity, flame temperatures, MAP preset)

---

## PHASE 9 — Recuperator on the combustion modes

- [x] `CombustionModeInputDto` (`mode` + input of that mode) as `RecuperatorInputDto.combustion`; `fPower_W`, `fuelQ_Jkg`, `kExcessAir`, `wH2Om`, `pO2` removed from the recuperator input
- [x] `CombustionService.flueGas(input, airPreheat_K)` → `FlueGas` (air = primary + secondary, last step's gas)
- [x] Smoke start constants moved to `RECUPERATOR`; `Q_CARBON_J_KG`, `Q_CO_J_KG`, `Q_H2_J_KG` removed
- [x] Tests: `combustion.service.spec.ts` (`flueGas`), `recuperator.service.spec.ts` (all four modes, air preheat)
