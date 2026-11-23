# Component Effects Algorithm Documentation

**Date:** February 2, 2026  
**Version:** 1.0  
**Status:** Complete

---

> **Status:** Dataset lives in `data/component-properties.data.ts` (`COMPONENT_PROPERTIES`, keyed by chemical formula `SiO2`, `Al2O3`, …). Lookups and weighted aggregates are `ComponentProperties` static methods in `utils/component-properties.ts`. Used by refractoriness, phase equilibrium, thermal performance, and glass-viscosity component breakdown. Effect magnitudes below still lack literature `RefKey` sources.

## Overview

The component effects system provides centralized, data-driven calculations for how chemical components (oxides, fluorides, chlorides) affect various refractory properties across the application.

### Key Concept

Instead of hardcoding individual component coefficients scattered throughout services, all component data is stored as `ComponentProperty` (`types/component-property.type.ts`) with:
- **refractorinessEffect** (K) - Impact on refractoriness temperature
- **liquidusEffect** (K) - Impact on liquidus temperature  
- **viscosityEffect** (K) - Impact on viscosity (activation energy)
- **liquidEnrichmentFactor** (multiplier) - How much enriches in liquid phase
- **solidEnrichmentFactor** (multiplier) - How much enriches in solid phase

## Data Structure

### ComponentProperty (dataset row)

```typescript
// types/component-property.type.ts — shape of each COMPONENT_PROPERTIES entry
export type ComponentProperty = {
  name: string;
  formula: string; // registry key, e.g. 'SiO2'
  category: 'oxide-former' | 'oxide-modifier' | 'fluoride' | 'chloride';
  classification: 'network-former' | 'network-modifier' | 'flux' | 'destabilizer';
  refractorinessEffect: number;
  liquidusEffect: number;
  viscosityEffect?: number;
  conductivity_WmK: number;
  specificHeat_JkgK: number;
  meltingPoint_C?: number;
  liquidEnrichmentFactor?: number;
  solidEnrichmentFactor?: number;
  description?: string;
};
```

### Component Categories

#### Oxide Network Formers (8)
These increase viscosity and refractoriness by forming strong covalent networks:
- **AL2O3** (Aluminum Oxide): +800K refractoriness, +1000K liquidus, +5000K viscosity
- **SIO2** (Silicon Dioxide): +500K refractoriness, +800K liquidus, +3000K viscosity
- **CR2O3** (Chromium Oxide): +700K refractoriness, +1200K liquidus, +1800K viscosity
- **ZRO2** (Zirconium Dioxide): +600K refractoriness, +1400K liquidus, +2000K viscosity
- **TIO2** (Titanium Oxide): +400K refractoriness, +400K liquidus, +1500K viscosity
- **MGO** (Magnesium Oxide): -500K refractoriness, +800K liquidus, -3500K viscosity (acts as flux)
- **B2O3** (Boron Oxide): +200K refractoriness, -2000K liquidus, +2500K viscosity
- **GEO2** (Germanium Dioxide): +300K refractoriness, +600K liquidus, +3500K viscosity

#### Oxide Network Modifiers (14)
These decrease viscosity and refractoriness by breaking network bonds (flux effect):
- **NA2O**: -900K refractoriness, -1500K liquidus, -5500K viscosity
- **K2O**: -850K refractoriness, -1400K liquidus, -5000K viscosity
- **LI2O**: -800K refractoriness, -1300K liquidus, -6000K viscosity (strongest flux)
- **PBO**: -750K refractoriness, -1800K liquidus, -4500K viscosity
- **CAO**: -600K refractoriness, -800K liquidus, -4000K viscosity
- **BAO**: -550K refractoriness, -600K liquidus, -3800K viscosity
- **SRO**: -520K refractoriness, -700K liquidus, -3600K viscosity
- **MNO**: -400K refractoriness, -500K liquidus, -3200K viscosity
- **FEO**: -450K refractoriness, -400K liquidus, -3000K viscosity
- **FE2O3**: -450K refractoriness, -300K liquidus, -3000K viscosity
- **COO**: -350K refractoriness, -400K liquidus, -2800K viscosity
- **NIO**: -330K refractoriness, -350K liquidus, -2600K viscosity
- **CUO**: -320K refractoriness, -400K liquidus, -2400K viscosity

#### Fluoride Components (6)
Very strong fluxes, highly volatile, highly enriched in liquid phase:
- **NAF**: -850K refractoriness, -1600K liquidus, -5200K viscosity
- **KF**: -820K refractoriness, -1500K liquidus, -4800K viscosity
- **LIF**: -800K refractoriness, -1400K liquidus, -5500K viscosity
- **CAF2**: -600K refractoriness, -900K liquidus, -3500K viscosity
- **MGF2**: -480K refractoriness, -700K liquidus, -3200K viscosity
- **ALF3**: -280K refractoriness, -1000K liquidus, -2500K viscosity

#### Chloride Components (6)
Volatile fluxes, highly enriched in liquid phase, mostly evaporate at high T:
- **NACL**: -750K refractoriness, -1400K liquidus, -4800K viscosity
- **KCL**: -720K refractoriness, -1300K liquidus, -4500K viscosity
- **CACL2**: -550K refractoriness, -800K liquidus, -3200K viscosity
- **MGCL2**: -420K refractoriness, -600K liquidus, -2800K viscosity
- **FECL2**: -380K refractoriness, -400K liquidus, -2600K viscosity
- **FECL3**: -360K refractoriness, -350K liquidus, -2400K viscosity

## Enrichment Factors

### Liquid Phase Enrichment
Represents how much a component concentrates in the liquid phase during melting:

```
< 1.0    = Depleted in liquid (stays in solid)
  1.0    = Neutral (distributed equally)
> 1.0    = Enriched in liquid (prefers liquid)
> 2.0    = Highly enriched/volatile
```

**Examples:**
- AL2O3: 0.85 (depleted - refractory oxide stays in solid)
- NA2O: 1.5 (enriched - flux prefers liquid)
- NACL: 2.5 (highly enriched - volatile)

### Solid Phase Enrichment
Represents how much a component remains in the solid phase:

```
< 0.5    = Mostly leaves solid
  0.5    = Half stays, half leaves
> 0.8    = Mostly stays in solid
  1.0    = Completely retained
```

**Examples:**
- Refractory oxides (Al2O3, SiO2): 1.0 (stay in solid)
- Flux oxides (Na2O, CaO): 0.4 (leave solid for liquid)
- Fluorides/Chlorides: 0.1 (almost all leave - volatile)

## Static helpers (`ComponentProperties`)

All aggregations live on `utils/component-properties.ts` (`ComponentProperties`):

| Method | Role |
|---|---|
| `get(formula)` | Lookup one row |
| `refractorinessEffect(composition)` | Σ (%/100)×`refractorinessEffect` |
| `liquidusEffect(composition)` | Same with `liquidusEffect` |
| `viscosityEffect(composition)` | Same with `viscosityEffect` (skips missing) |
| `weightedThermalConductivity` / `weightedSpecificHeat` | Mass-weighted λ / Cp |
| `liquidCompositionWithEnrichment` / `solidCompositionWithEnrichment` | Apply enrichment factors |
| `extractByCategory(composition)` | Bucket wt% by former/modifier/fluoride/chloride |

**Weighted-effect algorithm:** iterate composition → resolve by formula → add `(% / 100) × effect`.

## Physical Basis

### Effects Convention
- **Positive values:** Increase property (network formers strengthen)
- **Negative values:** Decrease property (fluxes weaken/soften)
- **All in Kelvin (K):** Standard thermodynamic unit

### Refractoriness Effect
Based on oxide role in ceramic network:
- Network formers (SiO2, Al2O3): High positive effect
- Network modifiers (Na2O, CaO): High negative effect
- Ratio affects melting behavior

### Liquidus Effect
Slightly different from refractoriness due to:
- Phase diagram geometry
- Eutectic systems
- Liquid composition effects
- Some components behave differently in liquid

**Example:** B2O3 has +200K refractoriness but -2000K liquidus (very strong flux behavior in liquid).

### Viscosity Effect (Activation Energy)
Follows Arrhenius model: η = A × exp(E/RT)
- Network formers increase E (higher viscosity)
- Fluxes decrease E (lower viscosity)
- Effect is often larger than refractoriness effect

### Enrichment Factors
Based on phase equilibrium and liquid-solid partitioning:
- **Refractories stay in solid:** Low liquid enrichment (0.5-0.85)
- **Fluxes prefer liquid:** High liquid enrichment (1.5-2.0+)
- **Volatile components:** Very high liquid enrichment (2.0-2.5)

## Integration with Services

### RefractorinessService
```typescript
const effectFromComponents = calculateRefractorinessEffect(composition);
refractorinessTemp += effectFromComponents;
```

### PhaseEquilibriumService
```typescript
const liquidEffect = calculateLiquidusEffect(comp);
const liquid = calculateLiquidCompositionWithEnrichment(original);
const solid = calculateSolidCompositionWithEnrichment(original);
```

### ViscosityService
```typescript
const effectFromComponents = calculateViscosityEffect(liquidComposition);
B += effectFromComponents;
```

## Validation & Verification

### Data Quality Checks
- ✅ All 33 components defined
- ✅ All effects in K (Kelvin)
- ✅ Enrichment factors 0.1-2.5 range
- ✅ Melting points realistic
- ✅ Descriptions present and accurate

### Compilation
- ✅ TypeScript type safety
- ✅ Interface enforcement
- ✅ No hardcoded coefficients in services
- ✅ Automatic iteration support

### Testing Scenarios
1. Single component: Each component tested individually
2. Multi-component: Complex compositions calculated correctly
3. Limits: Edge cases (100% single component) work correctly
4. Balance: Component distributions sum appropriately

## Future Extensions

### Adding New Components
1. Add a private `ComponentProperty` const in `data/component-properties.data.ts`.
2. Register it under `[row.formula]: row` in `COMPONENT_PROPERTIES`.
3. `ComponentProperties` methods pick it up automatically via formula iteration.
4. Prefer citing a `RefKey` when effect magnitudes gain literature sources.

## References

- **Kingery et al. (1976):** Introduction to Ceramics, 2nd ed.
- **Lee & Rainforth (1994):** Ceramic Microstructures  
- **Schacht (2004):** Refractories Handbook
- **American Ceramic Society:** Phase Diagram Database
- **NIST:** Ceramic Phase Diagrams

## File Location

- **Dataset:** `backend/src/modules/refractory/data/component-properties.data.ts`
- **Helpers:** `backend/src/modules/refractory/utils/component-properties.ts`
- **Type:** `backend/src/modules/refractory/types/component-property.type.ts`

---

**Status:** Production Ready ✅

