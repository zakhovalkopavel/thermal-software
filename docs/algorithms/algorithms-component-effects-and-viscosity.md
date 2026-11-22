# Component Effects, Mineral Phases, Refractoriness, Glass Viscosity

**Parent index:** [README.md](./README.md)

---

**File:** [`phase-equilibrium/COMPONENT_EFFECTS.md`](./phase-equilibrium/COMPONENT_EFFECTS.md)

### Key Concepts
- **33 Components** organized in 4 categories (oxides, fluorides, chlorides)
- **5 Effect Types** per component (refractoriness, liquidus, viscosity, enrichment factors)
- **Automatic Iteration** through components via helper functions
- **Single Source of Truth** - no duplicate definitions

### Components by Category

| Category | Count | Examples |
|----------|-------|----------|
| Oxide Formers | 8 | Al2O3, SiO2, Cr2O3, ZrO2 |
| Oxide Modifiers | 14 | Na2O, K2O, CaO, Li2O |
| Fluorides | 6 | NaF, KF, LiF, CaF2 |
| Chlorides | 6 | NaCl, KCl, CaCl2, MgCl2 |
| **TOTAL** | **34** | - |

### Helper Functions

```typescript
calculateLiquidusEffect(composition)             // → number (K)
calculateViscosityEffect(composition)            // → number (K)
calculateLiquidCompositionWithEnrichment(comp)  // → Record<string, number>
calculateSolidCompositionWithEnrichment(comp)   // → Record<string, number>
```

### Service Integration

**PhaseEquilibriumService:**
```typescript
const liquid = calculateLiquidCompositionWithEnrichment(original);
const solid = calculateSolidCompositionWithEnrichment(original);
```

**ViscosityService:**
```typescript
const effectFromComponents = calculateViscosityEffect(liquidComposition);
B += effectFromComponents;
```

---

## Mineral Phase Identification

**File:** [`phase-equilibrium/MINERAL_PHASE_IDENTIFICATION.md`](./phase-equilibrium/MINERAL_PHASE_IDENTIFICATION.md)

### 17 Mineral Phases Identified

#### Alumina Phases (3)
1. **Mullite** (3Al₂O₃·2SiO₂) - 1850°C - Primary refractory phase
2. **Corundum** (Al₂O₃) - 2054°C - High alumina refractories
3. **β-Alumina** (Na₂O·11Al₂O₃) - 1860°C - Ionic conductor

#### Silica Phases (3)
1. **Quartz** (SiO₂) - 1713°C - Low temperature
2. **Cristobalite** (SiO₂-β) - 1723°C - Intermediate (>268°C)
3. **Tridymite** (SiO₂) - 1713°C - High temperature (>867°C)

#### Calcium Silicates (2)
1. **Gehlenite** (2CaO·Al₂O₃·SiO₂) - 1593°C
2. **Anorthite** (CaO·Al₂O₃·2SiO₂) - 1553°C

#### Magnesium Phases (3)
1. **Spinel** (MgO·Al₂O₃) - 2135°C - High strength
2. **Forsterite** (2MgO·SiO₂) - 1890°C - Olivine structure
3. **Periclase** (MgO) - **2800°C** - HIGHEST melting oxide

#### Iron Phases (2)
1. **Magnetite** (Fe₃O₄) - 1538°C - Magnetic iron oxide
2. **Wustite** (FeO) - 1377°C - Iron(II) oxide

#### Other Phases (4)
1. **Chromite** ((Fe,Mg)O·Cr₂O₃) - 2180°C - High-T stable
2. **Zirconia** (ZrO₂) - **2715°C** - EXTREMELY high melting
3. **Nepheline** (NaAlSiO₄) - 1525°C - Feldspathoid
4. *(Mixed solid solution)* - Default for unidentified phases

### Detection Algorithm

```
Extract Oxides → Check Alumina → Check Silica → Check Calcium
     ↓                           ↓
   Check Magnesium ← Check Iron → Check Chromium → Check Zirconia
     ↓
  Check Sodium → Return Identified Phases
```

### Key Features
- **Temperature-dependent** phase formation (Cristobalite, Tridymite, Zirconia polymorphs)
- **Stoichiometric** ratio calculations
- **Competing reactions** handled (e.g., Mullite vs. Quartz)
- **Melting points** for each phase

---

## Refractoriness Calculation

**File:** [`phase-equilibrium/REFRACTORINESS_ALGORITHM.md`](./phase-equilibrium/REFRACTORINESS_ALGORITHM.md)

Mix fractions in. The whole fired composition is equilibrated on the phase diagrams of [FULL_PHASE_EQUILIBRIUM.md](./phase-equilibrium/FULL_PHASE_EQUILIBRIUM.md), and bisection on the equilibrium liquid gives:
- solidus (first liquid) and liquidus (all but inert and unmodelled parts liquid);
- the temperature at each requested liquid fraction (default 10, 25, 50 %).

The refractoriness (cone test, ASTM C24 / GOST 4069) is the temperature at which the equilibrium liquid reaches the critical fraction L\*, fitted to published cone values of reference materials; it comes with the cone equivalent and the fit RMS as uncertainty. For aluminosilicates inside its verified range, `(360 + Al2O3 − ΣR) / 0.228` °C is reported as a second value, and compositions in an ASTM C27 class are checked against the class minimum. Refractoriness under load (ISO 1893) is not estimated. The former estimate `RT = 1400 °C + Σ wt% · effect` had no source, and its lookup matched only K2O.

---

## Glass Viscosity Algorithm

**Directory:** [`glass-viscosity/`](./glass-viscosity/) — 14-chapter specification  
**Index:** [`glass-viscosity/INDEX.md`](./glass-viscosity/INDEX.md)

### Key Features

✅ **Glass-Specific:**
- ASTM C965-96 fixed points (softening, working, annealing, strain)
- Suitable for glass processing conditions (500-1200°C)
- Component breakdown for verification

✅ **All 33 Components:**
- 8 Oxide network formers
- 14 Oxide network modifiers
- 6 Fluorides
- 6 Chlorides

✅ **Arrhenius Model:**
```
η = A × exp(B/T)
```

Same model as ViscosityService but glass-optimized!

### Fixed Points Calculated
- Softening Point (10^6.6 Pa·s) - Deforms under load
- Working Point (10^3 Pa·s) - Practical forming T
- Annealing Point (10^12 Pa·s) - Stress relief begins
- Strain Point (10^13.5 Pa·s) - Stress relief complete

### Example Applications
- Window glass design
- Bottle glass formulation
- Laboratory glassware (borosilicate)
- Crystal glass (lead-based)
- Specialty optical glass

---


### Phase Equilibrium Calculation

Determines liquid and solid compositions at equilibrium:

**Features:**
- Liquid enrichment in fluxes
- Solid enrichment in refractories
- Eutectic composition blending
- Fluoride and chloride volatility handling

**Uses:**
- Component enrichment factors from Component Effects System

### Viscosity Calculation

Estimates melt viscosity using Arrhenius model:

```
η = A × exp(B/T)
B = B_Base + Viscosity_Effect_from_Components
```

**Features:**
- Temperature-dependent viscosity
- Component activation energy contributions
- Liquid composition effects

**Uses:**
- Viscosity effects from Component Effects System
- Liquid composition from Phase Equilibrium

### Glass Viscosity

Special variant for glass compositions:
- Different base parameters
- Additional temperature terms
- Silicate network structure

---
