# Module Architecture — Boundaries and Ownership

**Date:** March 2026  
**Status:** Approved for planning

---

## The problem

Both `legacy/scripts/src/` (recuperator) and `legacy/furnaceCombustion/classes/` implement gas thermophysical properties, but at different levels:

| Capability | `legacy/scripts/src/` | `legacy/furnaceCombustion/classes/` |
|---|---|---|
| Cp, H, S, G | Multi-equation polynomial framework (quartic/cubic/AlyLee/DIPPR102) — **validated, ref-cited** | NASA-7 polynomials — correct but coefficients marked "approximate, truncated" |
| Viscosity | Empty (`air.ts`) or not yet wired; Sutherland available via `FluidConditionCompound` | Sutherland law per species + Wilke mixing — **complete** |
| Thermal conductivity | DIPPR102 per compound — **complete** | Eucken relation using Sutherland μ — simpler, less accurate |
| Diffusion | Lennard-Jones params on `Air` only | Chapman–Enskog for 7 species — **complete** |
| Equation framework | General-purpose, extensible, multi-reference | Hardcoded per class |

**Decision:** These are not two competing implementations — they are two layers serving different use cases. The architecture separates them into two backend modules: `thermodynamics` and `combustion`. Both consume a shared library.

---

## Module map

```
backend/src/
├── common/
│   └── thermal/                        ← SHARED LIBRARY
│       ├── compound/gas/               ← polynomial Cp/λ/μ data objects (from legacy/scripts/src/)
│       ├── fluid-condition/            ← FluidConditionCompound, FluidDynamics
│       ├── interface/                  ← CompoundValue, Composition, Fluid, etc.
│       ├── dto/                        ← EquationTypeDto, ChemicalCompoundsDto
│       └── utils/                      ← equation methods, temperature utils
│
└── modules/
    ├── thermodynamics/                 ← MODULE 1: gas & fluid physical properties
    │   ├── services/
    │   │   ├── gas-properties.service.ts         ← Cp/H/S/G (all equations), μ, λ, ρ, Pr, cpCompare()
    │   │   ├── transport.service.ts              ← Sutherland + Wilke (from furnaceCombustion)
    │   │   ├── diffusion.service.ts              ← Chapman-Enskog (from furnaceCombustion)
    │   │   └── dimensionless-numbers.service.ts  ← Re, Pr, Nu, Gr, Ra — all geometries, API-exposed
    │   └── ...
    │
    ├── combustion/                     ← MODULE 2: reactions, flame, kinetics
    │   ├── services/
    │   │   ├── combustion.service.ts           ← flame temp, products, energy balance
    │   │   ├── chemical-kinetics.service.ts    ← Arrhenius rates (from furnaceCombustion)
    │   │   ├── equilibrium.service.ts          ← Gibbs minimiser (from furnaceCombustion)
    │   │   └── furnace-combustion.service.ts   ← layer-by-layer model
    │   └── ...
    │
    ├── recuperator/                    ← MODULE 3: heat exchangers
    │   ├── services/
    │   │   ├── air-properties.service.ts       ← uses ThermodynamicsModule
    │   │   ├── gas-composition.service.ts      ← uses ThermodynamicsModule
    │   │   ├── heat-transfer.service.ts
    │   │   ├── radiation.service.ts
    │   │   ├── geometry.service.ts
    │   │   ├── thermal-insulation.service.ts
    │   │   ├── material.service.ts
    │   │   ├── furnace.service.ts
    │   │   └── recuperator-optimizer.service.ts ← uses CombustionModule + ThermodynamicsModule
    │   └── ...
    │
    ├── thermophysical/                 ← MODULE 4: compound library (CSV → DB)
    │   └── services/
    │       └── thermophysical-file.service.ts  ← reads shared/processed/*.csv
    │
    └── materials/                      ← MODULE 5 (future): unified material DB
        └── ...
```

---

## Ownership table — every legacy class maps to exactly one module

| Legacy class / file | Target module | Notes |
|---|---|---|
| `legacy/scripts/src/compound/gas/*.ts` | `common/thermal/compound/gas/` | Shared — no module |
| `legacy/scripts/src/thermalExchange/fluidConditionCompound.ts` | `common/thermal/fluid-condition/` | Shared |
| `legacy/scripts/src/thermalExchange/fluidDynamics.ts` | `common/thermal/fluid-condition/` | Shared |
| `legacy/scripts/src/thermalExchange/gasComposition.ts` | `thermodynamics` | Needs fixes (see recuperator CH07) |
| `legacy/scripts/src/thermalExchange/fluidConditionComposition.ts` | `thermodynamics` | Stub — implement |
| `legacy/furnaceCombustion/classes/Thermodynamics.js` | `common/thermal/utils/nasa7-equation-method.ts` | NASA-7 coefficients go into each compound's `heatCapacity.values[]` as `EquationTypeDto.nasa7` entries. `Nasa7EquationMethod` added to `common/thermal`. H/S/G accessed via `GasPropertiesService` — no separate service. |
| `legacy/furnaceCombustion/classes/TransportProperties.js` | `thermodynamics` → `transport.service.ts` | Sutherland + Wilke |
| `legacy/furnaceCombustion/classes/DiffusionCoefficients.js` | `thermodynamics` → `diffusion.service.ts` | Chapman-Enskog |
| `legacy/furnaceCombustion/classes/GasProperties.js` | `thermodynamics` → `gas-properties.service.ts` | Aggregator facade |
| `legacy/furnaceCombustion/classes/FuelDatabase.js` | `combustion` | Fuel data |
| `legacy/furnaceCombustion/modules/ChemicalKinetics.js` | `combustion` | Arrhenius rates |
| `legacy/furnaceCombustion/modules/EquilibriumSolver.js` | `combustion` | Gibbs minimiser |
| `legacy/furnaceCombustion/modules/HeatTransfer.js` | **`thermodynamics`** | Gunn correlation, packed-bed convection |
| `legacy/furnaceCombustion/modules/Aerodynamics.js` | `thermodynamics` | Packed-bed flow, pressure drop |
| `legacy/furnaceCombustion/furnace_combustion_model.js` | `combustion` | Layer model — orchestrates all |
| `legacy/scripts/recuperator.js` combustion section | `combustion` → `combustion.service.ts` | Simplified flame temp / products |
| `legacy/scripts/recuperator.js` heat transfer section | `recuperator` | All other services |

> **Note on `HeatTransfer.js`:** Despite being in `furnaceCombustion/modules/`, it contains general correlations (Gunn, natural convection, radiation) — not combustion-specific. It belongs in `thermodynamics` so both `recuperator` and `combustion` modules can use it.

---

## Key boundary rules

1. **`common/thermal/`** owns equation evaluation machinery and raw gas property data objects. No NestJS decorators. No business logic.

2. **`thermodynamics` module** owns the answer to *"what are the physical properties of this gas/fluid at this T and P?"*  
   — Cp, H, S, G via `GasPropertiesService` (all equation types — quartic, cubic, AlyLee, nasa7 — unified framework)  
   — μ, λ (Sutherland + Wilke + DIPPR102)  
   — diffusion coefficients (Chapman-Enskog)  
   — Re, Pr, Nu, Gr, Ra for **all geometries and flow regimes** via `DimensionlessNumbersService` — API-exposed  
   — packed-bed heat transfer correlations (Gunn) — part of `DimensionlessNumbersService`

3. **`combustion` module** owns the answer to *"what happens when this fuel burns?"*  
   — combustion products composition  
   — flame temperature  
   — reaction rates (Arrhenius)  
   — thermochemical equilibrium (Gibbs)  
   — layer-by-layer furnace simulation  
   It **consumes** `ThermodynamicsModule` for all physical property lookups.

4. **`recuperator` module** owns the answer to *"how efficient is this heat exchanger?"*  
   It **consumes** `ThermodynamicsModule` and `CombustionModule`.  
   It does not implement any fluid property formulae internally.

5. **`thermophysical` module** owns the compound database (CSV → DB). Provides search/lookup endpoints.

6. **`materials` module** (future) unifies all material thermal property data currently scattered in `data/materials/*.data.ts` files.

---

## Cp source resolution

There is **one framework** — the `common/thermal` equation evaluation system (`EquationTypeDto` + `EquationValue[]` + equation method classes). NASA-7 is added as a new variant (`EquationTypeDto.nasa7`) inside it — not a separate parallel system.

Each compound already stores multiple equations in `heatCapacity.values[]` from different references. The `def` index selects the default. Any entry can be selected explicitly, and all can be compared at once via `GasPropertiesService.cpCompare()`.

| Use case | Mechanism | Equation type |
|---|---|---|
| Recuperator energy balance | `FluidConditionCompound` with `def` index | quartic ref.6 (current default) |
| Combustion flame temperature | `FluidConditionCompound` with `def` index | same — consistent with recuperator |
| H, S, G for Gibbs equilibrium | `Nasa7EquationMethod.enthalpy/entropy/gibbsEnergy` | `nasa7` entry in `values[]` |
| Cross-validation | `GasPropertiesService.cpCompare(species, T)` | all `values[]` entries |

No module may implement its own Cp formula. All requests go through `common/thermal` + `ThermodynamicsModule`.


