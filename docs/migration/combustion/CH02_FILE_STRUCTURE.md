# CH02 — File Structure

```
backend/src/modules/combustion/
├── combustion.module.ts
├── controllers/
│   └── combustion.controller.ts
├── services/
│   ├── combustion.service.ts              # flame temp, products — from recuperator.js ~575–680
│   ├── chemical-kinetics.service.ts       # Arrhenius rates — from furnaceCombustion/modules/ChemicalKinetics.js
│   ├── equilibrium.service.ts             # Gibbs minimiser — from furnaceCombustion/modules/EquilibriumSolver.js
│   └── furnace-combustion.service.ts      # layer-by-layer model — from furnaceCombustion/furnace_combustion_model.js
│
│   # NOTE: Thermodynamics.js, TransportProperties.js, DiffusionCoefficients.js,
│   #       HeatTransfer.js, Aerodynamics.js → moved to ThermodynamicsModule
├── dto/
│   ├── combustion-input.dto.ts
│   ├── combustion-products.dto.ts         # exported — consumed by RecuperatorModule
│   ├── flame-calc-params.dto.ts
│   └── layer-combustion-result.dto.ts
├── interfaces/
│   ├── gas-mixture.interface.ts
│   └── fuel.interface.ts
├── enums/
│   └── fuel-type.enum.ts
└── data/
    └── fuels/
        ├── fuel.interface.ts
        ├── charcoal-briquette.data.ts
        └── natural-gas.data.ts
```

## Shared thermal library usage

`ThermodynamicsService` and `TransportPropertiesService` **must** import compound objects from  
`backend/src/common/thermal/compound/gas/` rather than re-implementing coefficients.

`furnaceCombustion/classes/Thermodynamics.js` uses NASA-7 coefficients.  
`legacy/scripts/src` uses polynomial equation-value objects.  
**Resolution:** NASA-7 coefficients are added as a new `EquationTypeDto` entry (`nasa7`) in the shared library, or kept as a parallel data set in `combustion/data/` with a clear comment referencing the NASA TM-4513 source.  
Decision is deferred to detailed spec — see [CH05_THERMODYNAMICS.md](CH05_THERMODYNAMICS.md).

