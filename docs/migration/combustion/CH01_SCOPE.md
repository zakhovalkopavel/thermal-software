# CH01 — Scope

## What belongs in `CombustionModule`

| Concern | Source | Belongs here |
|---|---|---|
| Adiabatic flame temperature | `recuperator.js` ~575–658 | ✅ |
| Combustion products composition (mass fractions) | `recuperator.js` ~580–610 | ✅ |
| Water-gas shift equilibrium (CO + H2O ↔ CO2 + H2) | `recuperator.js` ~610–620 | ✅ |
| Excess air coefficient → O2/N2 fractions | `recuperator.js` ~580 | ✅ |
| NASA-7 polynomial Cp/H/S/G | `furnaceCombustion/classes/Thermodynamics.js` | ✅ |
| Reaction rate expressions (Arrhenius) | `furnaceCombustion/modules/ChemicalKinetics.js` | ✅ |
| Gibbs energy minimisation (equilibrium solver) | `furnaceCombustion/modules/EquilibriumSolver.js` | ✅ |
| Fuel database (charcoal, natural gas, etc.) | `furnaceCombustion/classes/FuelDatabase.js` | ✅ |
| Layer-by-layer furnace combustion simulation | `furnaceCombustion/furnace_combustion_model.js` | ✅ |

## What does NOT belong here

| Concern | Lives in |
|---|---|
| Air / gas thermophysical properties (Cp, λ, μ) | `backend/src/common/thermal/` |
| Convective / radiative heat transfer coefficients | `recuperator` module |
| Recuperator geometry and flow | `recuperator` module |
| Furnace wall heat flux (multi-layer) | `recuperator` module (`FurnaceService`) |

## Integration with RecuperatorModule

`RecuperatorOptimizerService` receives a `CombustionProductsDto` from `CombustionService.calculate()`.  
`CombustionModule` is imported by `RecuperatorModule`.

```
RecuperatorOptimizerService
  └── injects CombustionService (from CombustionModule)
        └── returns CombustionProductsDto
              ├── tFlameK
              ├── massFlowKgS
              ├── weightFractions  { N2, O2, CO2, H2O, CO, H2 }
              ├── pH2O
              └── pCO2
```

