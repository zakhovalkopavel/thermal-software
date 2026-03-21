# CH02 — File Structure

```
backend/src/modules/thermodynamics/
├── thermodynamics.module.ts
├── controllers/
│   └── thermodynamics.controller.ts
│       # POST /thermodynamics/dimensionless  — Re/Pr/Gr/Ra/Nu/h
│       # POST /thermodynamics/body-geometry  — area/volume/meanBeamLength
│       # GET  /thermodynamics/compare        — Cp comparison (dev)
├── services/
│   ├── gas-properties.service.ts         # Cp/H/S/G (all equations), cpCompare, mixture facade
│   ├── transport.service.ts              # Sutherland μ + Wilke mixing + Eucken λ
│   ├── diffusion.service.ts              # Chapman-Enskog D_ij
│   ├── dimensionless-numbers.service.ts  # Re/Pr/Nu/Gr/Ra + body geometry — see CH07
│   └── aerodynamics.service.ts           # Ergun pressure drop, superficial velocity
├── enums/
│   ├── flow-geometry.enum.ts             # PIPE_CIRCULAR, DUCT_*, FLAT_PLATE, PACKED_BED, ... (see CH07)
│   └── body-geometry.enum.ts             # SPHERE, CYLINDER, CUBE, CONE, TRUNCATED_CONE, ... (see CH07)
├── interfaces/
│   └── geometry-dims.interface.ts        # { a, b, c, L, epsilon, S_T, S_L, angle_deg }
├── dto/
│   ├── gas-mixture-input.dto.ts
│   ├── gas-properties-result.dto.ts
│   ├── cp-comparison-result.dto.ts
│   ├── dimensionless-input.dto.ts
│   ├── dimensionless-result.dto.ts
│   ├── body-geometry-input.dto.ts
│   ├── body-geometry-result.dto.ts
│   └── species.enum.ts
```

## Additions to `common/thermal` required by this module

```
backend/src/common/thermal/
├── dto/
│   └── equation-type.dto.ts              ← ADD: nasa7 = "nasa7" entry
├── type/
│   └── nasa7-equation.ts                 ← NEW: { low, high: number[7], Tswitch }
└── utils/
    ├── nasa7-equation-method.ts          ← NEW: calculate/calculateAverage/enthalpy/entropy/gibbsEnergy
    └── common.ts                         ← ADD: nasa7 case in equation() dispatch
```

Each gas compound (`n2.ts`, `co2.ts`, etc.) also gets a new `nasa7` entry added to its
`heatCapacity.values[]` array as part of ThermodynamicsModule PHASE 2.

## Relationship to `common/thermal`

```
ThermodynamicsModule
  GasPropertiesService
    └── FluidConditionCompound    (from common/thermal)
    └── gas compound objects      (from common/thermal/compound/gas/)
    └── FluidDynamics             (from common/thermal)
  Nasa7Service
    └── reads nasa7 EquationValue from compound.heatCapacity.values[]
    └── Nasa7EquationMethod       (from common/thermal/utils/)
  TransportService
    └── own Sutherland + Wilke    (from furnaceCombustion — not in common/thermal)
  DiffusionService
    └── LJ params from DiffusionCoefficients.js
    └── NH3 LJ params added
```

