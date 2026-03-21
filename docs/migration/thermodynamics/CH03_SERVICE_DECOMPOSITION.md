# CH03 — Service Decomposition

---

## `GasPropertiesService`

**Sources:** `legacy/scripts/src/thermalExchange/gasComposition.ts` + `GasProperties.js` + `furnaceCombustion/classes/Thermodynamics.js`

```typescript
@Injectable()
export class GasPropertiesService {
  // Cp [J/(mol·K)] using compound default def equation via FluidConditionCompound
  cpSpecies(species: Species, T_K: number, T0_K?: number): number

  // Cp using a specific values[] index — for explicit equation selection
  cpSpeciesByIndex(species: Species, equationIndex: number, T_K: number, T0_K?: number): number

  // Returns Cp from every values[] entry — for cross-approximation comparison
  cpCompare(species: Species, T_K: number): Array<{ index: number; type: string; ref: number; value: number }>

  // Molar enthalpy H [J/mol] — requires nasa7 entry in compound values[]
  h(species: Species, T_K: number): number

  // Molar entropy S [J/(mol·K)]
  s(species: Species, T_K: number): number

  // Gibbs energy G = H − T·S [J/mol]
  g(species: Species, T_K: number): number

  // Mixture Cp weighted by mass fractions
  cpMixture(weightFractions: Partial<SpeciesComposition>, T_K: number, T0_K?: number): number

  // Mixture molar enthalpy
  hMixture(composition: Partial<SpeciesComposition>, T_K: number): number

  // Ideal gas density [kg/m³]
  density(Mr: number, T_K: number, P_Pa?: number): number

  // Prandtl number
  prandtl(species: Species, T_K: number): number

  // Full property set for a mixture (Cp, H, μ, λ, D, ρ, Pr, M_avg)
  getMixtureProperties(composition: Partial<SpeciesComposition>, T_K: number, P_atm?: number): GasPropertiesResult
}
```

**Rule:** All Cp/H/S/G evaluation goes through `common/thermal` — either `FluidConditionCompound` for Cp,
or `Nasa7EquationMethod.enthalpy/entropy/gibbsEnergy` for H/S/G. No formula is evaluated directly inside this service.

---

## `TransportService`

**Source:** `legacy/furnaceCombustion/classes/TransportProperties.js`

```typescript
@Injectable()
export class TransportService {
  viscosity(species: Species, T_K: number): number            // Sutherland — Pa·s
  viscosityMix(composition: Partial<SpeciesComposition>, T_K: number): number   // Wilke rule
  thermalConductivity(species: Species, T_K: number, Cp_J_molK: number): number // Eucken — W/(m·K)
  thermalConductivityMix(composition: Partial<SpeciesComposition>, T_K: number): number
}
```

Sutherland + Wilke is distinct from DIPPR102 in `common/thermal` — different formula needed for
mixture viscosity and for combustion model consistency. Both co-exist; callers choose per use case.

Sutherland parameters: O2, N2, CO, CO2, H2, H2O, CH4. **Add NH3** (missing from legacy).

---

## `DiffusionService`

**Source:** `legacy/furnaceCombustion/classes/DiffusionCoefficients.js`

```typescript
@Injectable()
export class DiffusionService {
  binaryDiffusion(A: Species, B: Species, T_K: number, P_atm?: number): number         // m²/s — Chapman-Enskog
  effectiveDiffusion(species: Species, composition: Partial<SpeciesComposition>, T_K: number, P_atm?: number): number
  getAllDiffusionCoefficients(composition: Partial<SpeciesComposition>, T_K: number, P_atm?: number): Partial<Record<Species, number>>
}
```

LJ parameters: O2, N2, CO, CO2, H2, H2O, CH4. **Add NH3** (σ=2.900Å, ε/k=558.3K — Reid et al.).

---

## `DimensionlessNumbersService`

**Sources:**
- `legacy/scripts/src/thermalExchange/fluidDynamics.ts` — Re, Gr, Ra (single geometry — expand to all)
- `legacy/furnaceCombustion/modules/HeatTransfer.js` — Nu: Gunn (packed bed), Churchill–Chu (vertical cylinder)
- `legacy/scripts/recuperator.js` ~950–1010 — Nu: Mills (laminar pipe), Gnielinski (turbulent pipe)

All inputs are **plain numbers** — pre-computed fluid properties + dimensions.  
Does not call `GasPropertiesService` internally. Fully stateless — usable as a pure calculator.  
See [CH07_DIMENSIONLESS_NUMBERS.md](CH07_DIMENSIONLESS_NUMBERS.md) for full geometry list and correlations.

```typescript
@Injectable()
export class DimensionlessNumbersService {
  reynolds(rho, w, L, mu): number
  reynoldsKinematic(w, L, nu): number
  prandtl(mu, Cp_J_kgK, lambda): number
  grashof(T_hot_K, T_cold_K, L, nu): number
  rayleigh(T_hot_K, T_cold_K, L, nu, Pr): number
  nusselt(params: NusseltParams): NusseltResult      // geometry-dispatched, returns Nu + correlation name
  hFromNusselt(Nu, lambda, L): number
  hydraulicDiameter(area, perimeter): number
  characteristicLength(geometry: FlowGeometry, dims: GeometryDims): number
}
```

Geometries covered: `PIPE_CIRCULAR`, `PIPE_ANNULUS`, `DUCT_RECTANGULAR`, `FLAT_PLATE`,
`CYLINDER_CROSSFLOW`, `SPHERE`, `TUBE_BANK_INLINE`, `TUBE_BANK_STAGGERED`,
`VERTICAL_PLATE`, `VERTICAL_CYLINDER`, `HORIZONTAL_CYLINDER`,
`HORIZONTAL_PLATE_HOT_UP`, `HORIZONTAL_PLATE_HOT_DOWN`, `SPHERE_NATURAL`, `PACKED_BED`.

> `HeatTransferCorrelationsService` is **not created** — its correlations are absorbed here.

---

## `AerodynamicsService`

**Source:** `legacy/furnaceCombustion/modules/Aerodynamics.js`

```typescript
@Injectable()
export class AerodynamicsService {
  pressureDrop(params: PackedBedParams): number        // Pa/m — Ergun equation
  superficialVelocity(massFlow, rho, area): number     // m/s
}
```
