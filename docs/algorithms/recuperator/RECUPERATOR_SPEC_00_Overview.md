# RECUPERATOR SPEC — Overview

**Version:** 1.0  
**Language:** en-US  
**Primary Reference:** Mikheev M. A., Mikheeva I. M. *Osnovy teploperedachi* (Fundamentals of Heat Transfer). Energiya, 1977.

**Purpose:** Complete specification for a NestJS/TypeScript module that computes:
1. **Recuperator** — counter-flow heat exchanger length and air preheat temperature
2. **Furnace** — multilayer radial heat conduction through refractory walls
3. **Combustion** — adiabatic flame temperature and flue gas composition

All algorithms are derived directly from `legacy/scripts/recuperator.js`.

---

## 0.1 Scope

### Three Sub-Calculations

| Sub-module | Input | Output |
|---|---|---|
| **Combustion** | Fuel power, excess-air ratio, humidity | Flame temperature `T_flame`, smoke composition `{N₂, O₂, CO₂, CO, H₂O, H₂}` |
| **Recuperator** | Geometry, fuel params, target length | Optimised `T_smoke_end`, `T_air_end`, recuperator length `L` [m], efficiency [%] |
| **Furnace** | Multilayer wall definition, flame params | Inner/outer surface temperatures, heat flux density [W/m²], energy loss [W] |

---

## 0.2 Multi-Module Architecture

The recuperator feature is split across **5 modules** following strict SRP:

```
backend/src/modules/
│
├── combustion/                    — Flame temperature & smoke composition
│   ├── services/combustion.service.ts
│   ├── dto/{combustion-input,combustion-result}.dto.ts
│   ├── constants/combustion.constants.ts
│   ├── controllers/combustion.controller.ts
│   └── combustion.module.ts
│
├── refractory/ (extended)         — Add temperature-dependent thermal props
│   ├── enums/refractory-thermal-material.enum.ts   ← NEW
│   ├── services/refractory-thermal.service.ts       ← NEW (λ(T), ε(T) for 19 materials)
│   └── refractory.module.ts       ← exports RefractoryThermalService
│
├── metals/ (new)                  — Metal thermal properties
│   ├── enums/metal-material.enum.ts
│   ├── services/metal-thermal.service.ts            (λ(T), ε(T): AISI 304, mild steel)
│   ├── controllers/metals.controller.ts
│   └── metals.module.ts
│
├── thermal-exchange/ (new)        — Wall HTC, multilayer wall, HX cross-section
│   ├── enums/wall-geometry.enum.ts
│   ├── interfaces/{alpha-result,layer-material}.interface.ts
│   ├── dto/{layer,multilayer-wall-input,multilayer-wall-result}.dto.ts
│   ├── dto/{recuperator-htc-input,recuperator-htc-result}.dto.ts
│   ├── services/multilayer-wall.service.ts          (standalone wall calculation)
│   ├── services/recuperator-htc.service.ts          (cross-section HTC)
│   ├── controllers/thermal-exchange.controller.ts
│   └── thermal-exchange.module.ts
│
└── recuperator/ (thin)            — Counter-flow HX optimizer
    ├── enums/hole-form.enum.ts
    ├── constants/recuperator.constants.ts
    ├── dto/{recuperator-input,recuperator-result}.dto.ts
    ├── services/recuperator-geometry.service.ts
    ├── services/recuperator.service.ts              (optimizer only)
    ├── controllers/recuperator.controller.ts
    └── recuperator.module.ts
```

---

## 0.3 Service Dependency Map

```
CombustionController
    └── CombustionService
            └── GasPropertiesService        (ThermodynamicsModule)

MetalsController
    └── MetalThermalService                 (owns λ/ε for AISI 304, mild steel)

ThermalExchangeController
    └── MultilayerWallService
            ├── RefractoryThermalService    (RefractoryModule — 19 fire-brick materials)
            ├── MetalThermalService         (MetalsModule)
            ├── RadiationService            (ThermodynamicsModule)
            └── DimensionlessCalculationService (ThermodynamicsModule)
    └── RecuperatorHtcService
            ├── RadiationService            (ThermodynamicsModule)
            └── DimensionlessCalculationService (ThermodynamicsModule)

RecuperatorController
    └── RecuperatorService
            ├── CombustionService           (CombustionModule)
            ├── RecuperatorGeometryService
            ├── RecuperatorHtcService       (ThermalExchangeModule)
            └── GasPropertiesService        (ThermodynamicsModule)
```

---

## 0.4 Re-used ThermodynamicsModule Services

| Service | Method used | Purpose |
|---|---|---|
| `GasPropertiesService` | `cpMixture(moleFractions, T_K, T0_K)` | Enthalpy of smoke mixture |
| `GasPropertiesService` | `density(M, T_K)`, `molecularWeight(fractions)` | Gas density |
| `DimensionlessCalculationService` | `nusselt(dto)` → `h_W_m2K` | Internal convection HTC |
| `RadiationService` | `gasRadiationHTC(Tg, Ts, eps_s, pH2O, pCO2, L)` | Hottel–Mikheev gas radiation |
| `RadiationService` | `solidRadiationHTC(T1, T2, e1, e2)` | Surface-to-surface radiation |
| `TransportService` | `viscosityMix()`, `thermalConductivityMix()` | Transport properties |

---

## 0.5 API Summary

| Method | Path | Module | Description |
|---|---|---|---|
| POST | `/combustion/calculate` | `combustion` | Flame temperature + smoke composition |
| GET  | `/metals/thermal-properties` | `metals` | λ(T) and ε(T) for metal materials |
| POST | `/thermal-exchange/multilayer-wall` | `thermal-exchange` | Standalone multilayer wall heat loss |
| POST | `/recuperator/calculate` | `recuperator` | Counter-flow HX optimisation |

Full request/response shapes → [RECUPERATOR_SPEC_07_API.md](./RECUPERATOR_SPEC_07_API.md)

---

## 0.6 File Map

| File | Contents |
|---|---|
| `RECUPERATOR_SPEC_00_Overview.md` *(this file)* | Purpose, structure, service map, API summary |
| `RECUPERATOR_SPEC_01_Combustion.md` | Flame temperature, carbon combustion, water-gas shift |
| `RECUPERATOR_SPEC_02_Geometry.md` | Channel cross-sections, perimeters, equivalent diameters |
| `RECUPERATOR_SPEC_03_Materials.md` | 21 materials — λ(T) and ε(T) polynomials |
| `RECUPERATOR_SPEC_04_HeatTransfer.md` | Convection Nu, gas radiation, overall wall HTC |
| `RECUPERATOR_SPEC_05_RecuperatorAlgorithm.md` | Counter-flow optimiser, energy balance, grid search |
| `RECUPERATOR_SPEC_06_FurnaceAlgorithm.md` | Multilayer radial FD, binary search, outer cooling |
| `RECUPERATOR_SPEC_07_API.md` | Full endpoint specs, DTOs, request/response shapes |
| `RECUPERATOR_SPEC_08_Bibliography.md` | References and source citations |
