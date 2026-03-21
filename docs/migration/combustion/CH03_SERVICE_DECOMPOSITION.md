# CH03 — Service Decomposition

> Detailed spec TBD. This file is a planning skeleton.  
> Fill in after `ThermodynamicsModule` is complete.  
> All physical property lookups (Cp, μ, λ, D) are delegated to `ThermodynamicsModule` — not re-implemented here.

---

## `CombustionService`

**Source:** `recuperator.js` ~575–680

```typescript
findMaxFlameTemperature(params: FlameCalcParams): number
getCombustionProducts(k: number, wH2Om: number): Partial<Composition>  // mass fractions
systemEnergyChange(weightPartial: Partial<Composition>, massFlowRate: number, t1: number, t2: number): number
```

Algorithm (`findMaxFlameTemperature`):
1. Compute mass fractions N2, O2, CO2, H2O after combustion from `k`.
2. Water-gas shift when `k < 1`: CO + H2O → CO2 + H2.
3. Iterative energy balance: `Q = mGas · Cp_mix(composition, tFlame, t0) · (tFlame − t0)`.
4. Return `tFlame` in K.

Uses `GasPropertiesService` from `ThermodynamicsModule` for `Cp_mix`.  
Uses `Nasa7Service` for enthalpy-based flame temperature cross-check.

---

## `ChemicalKineticsService`

**Source:** `furnaceCombustion/modules/ChemicalKinetics.js`

Arrhenius rate expressions for:
- C + O2 → CO2 (heterogeneous combustion)
- C + CO2 → 2CO (Boudouard)
- CO + ½O2 → CO2 (gas phase)
- C + H2O → CO + H2 (steam gasification)
- CO + H2O ↔ CO2 + H2 (water-gas shift)

Uses Thiele modulus (internal diffusion efficiency `η`) via `DiffusionService` from `ThermodynamicsModule`.

---

## `EquilibriumService`

**Source:** `furnaceCombustion/modules/EquilibriumSolver.js`

Gibbs energy minimisation. Uses `Nasa7Service.g()` from `ThermodynamicsModule`.

---

## `FurnaceCombustionService`

**Source:** `furnaceCombustion/furnace_combustion_model.js`

Layer-by-layer simulation of cylindrical furnace with charcoal briquettes.  
Uses `HeatTransferCorrelationsService` and `AerodynamicsService` from `ThermodynamicsModule`.  
Uses `ChemicalKineticsService` and `EquilibriumService` from this module.

