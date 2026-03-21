# CH04 — Chemical Kinetics

> Detailed spec TBD. Skeleton only.

**Source:** `legacy/furnaceCombustion/modules/ChemicalKinetics.js`

## Reactions

| Reaction | Type | Notes |
|---|---|---|
| C + O2 → CO2 | Heterogeneous combustion | Primary oxidation |
| C + CO2 → 2CO | Boudouard reverse | Endothermic, dominant above 900°C |
| CO + ½O2 → CO2 | Homogeneous combustion | Gas phase |
| C + H2O → CO + H2 | Steam gasification | When moisture present |
| CO + H2O ↔ CO2 + H2 | Water-gas shift | Near-equilibrium |

## Rate form (Arrhenius)

```
r = A · exp(−Ea / R·T) · [C]^n
```

Parameters `A`, `Ea`, `n` per reaction sourced from `ChemicalKinetics.js`.  
Cross-check against NIST Chemical Kinetics Database before finalising.

## Integration with layer model

`FurnaceCombustionService` calls `ChemicalKineticsService.rate(reaction, T, concentrations)` per layer per time step.

