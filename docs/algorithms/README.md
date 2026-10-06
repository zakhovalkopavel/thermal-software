# Algorithms Documentation Index

**Last Updated:** May 2026
**Version:** 1.1

---

## Overview

Complete algorithmic documentation for the thermal-software calculation system.
Covers both the **Refractory module** (oxide composition calculations) and the
**Thermodynamics module** (gas-phase transport, heat transfer, radiation).

---

## 🔬 Thermodynamics Algorithms

These algorithms are implemented in `backend/src/modules/thermodynamics/` and
`backend/src/common/thermal/`. Full service method reference:
**[docs/services/THERMODYNAMICS_SERVICES.md](../services/THERMODYNAMICS_SERVICES.md)**  
Common library reference:
**[docs/services/COMMON_THERMAL_LIBRARY.md](../services/COMMON_THERMAL_LIBRARY.md)**

### Gas Thermophysical Properties

| Algorithm | Service | Formula / Model |
|-----------|---------|-----------------|
| **NASA-7 polynomial** | `GasPropertiesService` | `Cp/R = a1 + a2T + a3T² + a4T³ + a5T⁴`; two ranges at `Tswitch` |
| **NASA-9 polynomial** | `GasPropertiesService` | 9-coefficient, variable T ranges; preferred format |
| **Aly-Lee (DIPPR-107)** | `GasPropertiesService` | `c1 + c2[c3/T/sinh(c3/T)]² + c4[c5/T/cosh(c5/T)]²` |
| **Sutherland viscosity** | `TransportService` | `μ = μ₀(T/T₀)^(3/2)(T₀+S)/(T+S)` |
| **Eucken conductivity** | `TransportService` | `λ = μ(Cp + 5R/4M)` |
| **Ideal gas density** | `TransportService` | `ρ = PM/(RT)` |
| **Chapman-Enskog diffusion** | `DiffusionService` | `D = 1.858e-3·T^(3/2)·√(1/M_A+1/M_B) / (P·σ_AB²·Ω_D)` |
| **Mixture Cp** | `GasPropertiesService` | `Cp_mix = Σ xᵢ·Cpᵢ(T)` (mole fractions) |

### Dimensionless Numbers

| Number | Formula | Notes |
|--------|---------|-------|
| **Reynolds** | `Re = ρwL/μ` or `wL/ν` | `DimensionlessNumbersService` |
| **Prandtl** | `Pr = μCp/λ` | Fluid-only — no geometry |
| **Grashof** | `Gr = gβΔTL³/ν²`; `β = 2/(T_h+T_c)` | Ideal gas approximation |
| **Rayleigh** | `Ra = Gr·Pr` | Natural convection driver |

### Nusselt Correlations

| Geometry | Regime | Correlation |
|----------|--------|-------------|
| Pipe (internal) | Forced, laminar (Re < 2300) | Sieder-Tate |
| Pipe (internal) | Forced, turbulent (Re > 10 000) | Dittus-Boelter |
| Pipe (internal) | Natural | Churchill-Chu (1975) |
| Flat plate | Forced | Average flat-plate |
| Sphere | Forced | Whitaker (1972) |
| Cylinder (external) | Forced | Churchill-Bernstein (1977) |
| Annulus | Forced | Dittus-Boelter with hydraulic diameter |

### Radiation

| Algorithm | Service | Source |
|-----------|---------|--------|
| **Gas emissivity (CO₂+H₂O)** | `RadiationService` | Hottel-Mikheev; [21] Mikheev 1977 |
| **Radiation HTC** | `RadiationService` | `α = ε·σ·(T_g⁴−T_w⁴)/(T_g−T_w)` |
| **Stefan-Boltzmann** | `RadiationService` | `q = ε·σ·(T_h⁴−T_c⁴)` |
| **Linearised α_rad** | `RadiationService` | `α_lin = ε·σ·(T_h²+T_c²)·(T_h+T_c)` |

---

## 🔥 Refractory Algorithms

### Phase equilibrium — [`phase-equilibrium/`](./phase-equilibrium/)

| File | Topic | Status |
|------|-------|--------|
| [`FULL_PHASE_EQUILIBRIUM.md`](./phase-equilibrium/FULL_PHASE_EQUILIBRIUM.md) | `PhaseEquilibriumService`: lever rule on tabulated phase diagrams with a shrinking-core grain reaction; matrix equilibrium at T and after cooling (liquid → glass) | 🔄 REWRITTEN |
| [`MINERAL_PHASE_IDENTIFICATION.md`](./phase-equilibrium/MINERAL_PHASE_IDENTIFICATION.md) | Raw material mineralogy and phase catalog | ✅ |
| [`REFRACTORINESS_ALGORITHM.md`](./phase-equilibrium/REFRACTORINESS_ALGORITHM.md) | Equilibrium melting of the fired mix on the phase diagrams: solidus, liquidus, temperatures at given liquid fractions; cone refractoriness (ASTM C24 / GOST 4069) from a critical liquid fraction fitted to published cone values; no refractoriness under load (ISO 1893) | 🔄 REWRITTEN |
| [`COMPONENT_EFFECTS.md`](./phase-equilibrium/COMPONENT_EFFECTS.md) | Per-component effect table; only the component breakdown of `GlassViscosityService` still uses it | ⚠️ unsourced values |

### Mix — [`mix/`](./mix/)

| File | Topic | Status |
|------|-------|--------|
| [`MIX_COMPOSITION_ALGORITHM.md`](./mix/MIX_COMPOSITION_ALGORITHM.md) | `MixCompositionService`: fired-basis mixing of library raw-material compositions, composition key classification, true density | ✅ |
| [`MIX_THERMAL_ALGORITHM.md`](./mix/MIX_THERMAL_ALGORITHM.md) | `MixThermalService`: λ, Cp, ρ, diffusivity of a fired material or mix vs T (replaces the removed thermal-conductivity endpoint) | ✅ |

### Blend optimizer — [`blend-optimizer/`](./blend-optimizer/)

| File | Topic | Status |
|------|-------|--------|
| [`BLEND_OPTIMIZER_ALGORITHM.md`](./blend-optimizer/BLEND_OPTIMIZER_ALGORITHM.md) | Multi-stage PSD optimization integrating PSD + packing + shrinkage + water demand; 4 compaction scenarios | ✅ |
| [`BLEND_OPTIMIZER_FIXED_FRACTIONS.md`](./blend-optimizer/BLEND_OPTIMIZER_FIXED_FRACTIONS.md) | Fixed fractions & optimization goals | ✅ |
| [`BLEND_OPTIMIZER_INPUT_OUTPUT_DEMO.md`](./blend-optimizer/BLEND_OPTIMIZER_INPUT_OUTPUT_DEMO.md) | Blend optimizer I/O examples | ✅ |
| [`COMPONENT_SPECIFIC_THRESHOLDS.md`](./blend-optimizer/COMPONENT_SPECIFIC_THRESHOLDS.md) | Per-component validity thresholds | ✅ |
| [`VIABLE_COMPOSITION_RANGES.md`](./blend-optimizer/VIABLE_COMPOSITION_RANGES.md) | Composition feasibility ranges | ✅ |
| [`VIABLE_RANGE_OUTPUT_FORMAT.md`](./blend-optimizer/VIABLE_RANGE_OUTPUT_FORMAT.md) | Output format for viable range results | ✅ |

### Particle packing — [`particle-packing/`](./particle-packing/)

| File | Topic | Status |
|------|-------|--------|
| [`PACKING_MODELS.md`](./particle-packing/PACKING_MODELS.md) | CPM and Furnas packing density models | ✅ |
| [`PSD_ALGORITHMS.md`](./particle-packing/PSD_ALGORITHMS.md) | Andreasen and Funk-Dinger PSD models | ✅ |
| [`WATER_DEMAND_ALGORITHM.md`](./particle-packing/WATER_DEMAND_ALGORITHM.md) | Water demand from packing fraction | ✅ |
| [`SHRINKAGE_CALCULATOR_ALGORITHM.md`](./particle-packing/SHRINKAGE_CALCULATOR_ALGORITHM.md) | Chemical shrinkage (drying) and Master Sintering Curve (firing) | ✅ |

### Glass viscosity — [`glass-viscosity/`](./glass-viscosity/)

| File | Topic | Status |
|------|-------|--------|
| [`glass-viscosity/INDEX.md`](./glass-viscosity/INDEX.md) | Glass viscosity: Lakatos, Fluegel, VFT fitting | ✅ |

---

## 🌡️ Thermal Distribution Algorithms

Specification for temperature field and thermal distribution calculations (not yet implemented in backend).

**Sub-directory:** [`thermal-distribution/`](./thermal-distribution/)

| Spec file | Topic |
|-----------|-------|
| [`THERMAL_DISTRIBUTION_SPEC_00_Overview.md`](./thermal-distribution/THERMAL_DISTRIBUTION_SPEC_00_Overview.md) | Scope and design goals |
| [`THERMAL_DISTRIBUTION_SPEC_01_Geometries.md`](./thermal-distribution/THERMAL_DISTRIBUTION_SPEC_01_Geometries.md) | Supported geometries |
| [`THERMAL_DISTRIBUTION_SPEC_06_API.md`](./thermal-distribution/THERMAL_DISTRIBUTION_SPEC_06_API.md) | Planned API design |
| [`THERMAL_DISTRIBUTION_SPEC_07_Calibration.md`](./thermal-distribution/THERMAL_DISTRIBUTION_SPEC_07_Calibration.md) | Calibration strategy |
| [`THERMAL_DISTRIBUTION_SPEC_08_Bibliography.md`](./thermal-distribution/THERMAL_DISTRIBUTION_SPEC_08_Bibliography.md) | References |
| [`THERMAL_DISTRIBUTION_SPEC_09_Validation.md`](./thermal-distribution/THERMAL_DISTRIBUTION_SPEC_09_Validation.md) | Validation approach |
| [`THERMAL_DISTRIBUTION_SPEC_10_Examples.md`](./thermal-distribution/THERMAL_DISTRIBUTION_SPEC_10_Examples.md) | Worked examples |
| [`THERMAL_DISTRIBUTION_SPEC_11_QuickReference.md`](./thermal-distribution/THERMAL_DISTRIBUTION_SPEC_11_QuickReference.md) | Quick reference |

> ⚠️ **Not yet implemented.** These are design specifications only — no backend service exists yet.  
> When implementation begins, create `backend/src/modules/thermal-distribution/` and add an entry to `IMPLEMENTATION_STATUS.md`.

---

## 🌡️ Heat Conduction & Heat Transfer Coefficient

### Heat conduction — [`heat-conduction/`](./heat-conduction/)
**Service:** Transient heat conduction solver (BC I / BC III)
**Geometries:** Infinite Plate, Infinite Cylinder, Solid Sphere, Hollow Cylinder, Finite Parallelepiped, Finite Cylinder
**Reference:** Luikov A. V. *Analytical Heat Diffusion Theory.* Academic Press, 1968.

**Shared Foundation:**

| File | Contents |
|---|---|
| [`HEAT_CONDUCTION_00_OVERVIEW.md`](./heat-conduction/HEAT_CONDUCTION_00_OVERVIEW.md) | Objectives, architectural constraints, mathematical citation catalog, bibliography |
| [`HEAT_CONDUCTION_01_MATERIAL_PROPERTIES.md`](./heat-conduction/HEAT_CONDUCTION_01_MATERIAL_PROPERTIES.md) | AISI 304 thermophysical properties, mean property evaluation, effective heat transfer coefficient |

**BC I — Boundary Conditions of the First Kind ($Bi \to \infty$):**

| File | Geometry |
|---|---|
| [`HEAT_CONDUCTION_02_BC1_PLATE.md`](./heat-conduction/HEAT_CONDUCTION_02_BC1_PLATE.md) | Infinite Plate |
| [`HEAT_CONDUCTION_03_BC1_CYLINDER.md`](./heat-conduction/HEAT_CONDUCTION_03_BC1_CYLINDER.md) | Infinite Cylinder |
| [`HEAT_CONDUCTION_04_BC1_SPHERE.md`](./heat-conduction/HEAT_CONDUCTION_04_BC1_SPHERE.md) | Solid Sphere |
| [`HEAT_CONDUCTION_05_BC1_HOLLOW_CYLINDER.md`](./heat-conduction/HEAT_CONDUCTION_05_BC1_HOLLOW_CYLINDER.md) | Unbounded Hollow Cylinder |
| [`HEAT_CONDUCTION_06_BC1_PARALLELEPIPED.md`](./heat-conduction/HEAT_CONDUCTION_06_BC1_PARALLELEPIPED.md) | Rectangular Parallelepiped (product rule) |
| [`HEAT_CONDUCTION_07_BC1_FINITE_CYLINDER.md`](./heat-conduction/HEAT_CONDUCTION_07_BC1_FINITE_CYLINDER.md) | Finite Cylinder (product rule) |

**BC III — Boundary Conditions of the Third Kind ($0.1 < Bi < 100$):**

| File | Geometry |
|---|---|
| [`HEAT_CONDUCTION_08_BC3_PLATE.md`](./heat-conduction/HEAT_CONDUCTION_08_BC3_PLATE.md) | Infinite Plate — uniform, arbitrary, parabolic profiles |
| [`HEAT_CONDUCTION_09_BC3_CYLINDER.md`](./heat-conduction/HEAT_CONDUCTION_09_BC3_CYLINDER.md) | Infinite Cylinder — uniform, arbitrary, parabolic profiles |
| [`HEAT_CONDUCTION_10_BC3_SPHERE.md`](./heat-conduction/HEAT_CONDUCTION_10_BC3_SPHERE.md) | Solid Sphere — uniform, arbitrary, parabolic profiles |
| [`HEAT_CONDUCTION_11_BC3_HOLLOW_CYLINDER.md`](./heat-conduction/HEAT_CONDUCTION_11_BC3_HOLLOW_CYLINDER.md) | Infinite Hollow Cylinder — Bessel-Neumann eigenvalue expansion |
| [`HEAT_CONDUCTION_12_BC3_PARALLELEPIPED.md`](./heat-conduction/HEAT_CONDUCTION_12_BC3_PARALLELEPIPED.md) | Finite Parallelepiped — product rule, triple series |
| [`HEAT_CONDUCTION_13_BC3_FINITE_CYLINDER.md`](./heat-conduction/HEAT_CONDUCTION_13_BC3_FINITE_CYLINDER.md) | Finite Cylinder — product rule, double series |

**Solver Framework:**

| File | Contents |
|---|---|
| [`HEAT_CONDUCTION_14_TIME_STEPPING.md`](./heat-conduction/HEAT_CONDUCTION_14_TIME_STEPPING.md) | Nonlinear time-stepping, iterative convergence loop, sequential interval method |
| [`HEAT_CONDUCTION_15_BC_SELECTION_KONDRATIEV.md`](./heat-conduction/HEAT_CONDUCTION_15_BC_SELECTION_KONDRATIEV.md) | BC selection criteria, Kondratiev Regular Thermal Regime, inverse IHCP solver |
| [`HEAT_CONDUCTION_16_COMPLEX_GEOMETRIES.md`](./heat-conduction/HEAT_CONDUCTION_16_COMPLEX_GEOMETRIES.md) | Engineering approximations for complex shapes, automated topology classification |

### Heat transfer coefficient — [`heat-transfer-coefficient/`](./heat-transfer-coefficient/)
**Role:** Multi-regime HTC orchestrator — entry point for $\alpha(T_s)$ calculation used by the heat conduction solver
**Regimes:** Film boiling → Nucleate boiling → Single-phase convection

| File | Contents |
|---|---|
| [`HTC_00_REGIMES_OVERVIEW.md`](./heat-transfer-coefficient/HTC_00_REGIMES_OVERVIEW.md) | **Entry point.** Regime routing state machine, Leidenfrost / CHF2 switching boundaries |
| [`HTC_01_CRITICAL_FLUX.md`](./heat-transfer-coefficient/HTC_01_CRITICAL_FLUX.md) | Critical Heat Flux (CHF) and Minimum Heat Flux (MHF): Zuber, Kutateladze-Borishanskii, Kandlikar, Henry/Berenson models |
| [`HTC_02_FILM_BOILING.md`](./heat-transfer-coefficient/HTC_02_FILM_BOILING.md) | Film boiling: Leidenfrost marker, Bromley conductive film, Klimenko universal correlation, orientation routing |
| [`HTC_03_NUCLEATE_BOILING.md`](./heat-transfer-coefficient/HTC_03_NUCLEATE_BOILING.md) | Nucleate boiling: Labuntsov, Rohsenow, Kutateladze, Stephan-Abdelsalam, Cooper, Yang-Maas, Kovalev models |

---

## 🔥 Recuperator & Combustion

### Recuperator — [`recuperator/`](./recuperator/)
**Role:** Counter-flow heat exchanger optimisation, multilayer wall heat loss, combustion

| File | Contents |
|---|---|
| [`RECUPERATOR_SPEC_00_Overview.md`](./recuperator/RECUPERATOR_SPEC_00_Overview.md) | Multi-module architecture, service map, API summary |
| → [`combustion/07_RecuperatorFlueGas.md`](./combustion/07_RecuperatorFlueGas.md) | Combustion for the recuperator (selected mode, flue gas, smoke start temperature) — in the combustion docs |
| [`RECUPERATOR_SPEC_02_Geometry.md`](./recuperator/RECUPERATOR_SPEC_02_Geometry.md) | Channel cross-sections for 4 hole forms, perimeters, ray lengths |
| [`RECUPERATOR_SPEC_03_Materials.md`](./recuperator/RECUPERATOR_SPEC_03_Materials.md) | 21 materials: λ(T) and ε(T) split across refractory/metals modules |
| [`RECUPERATOR_SPEC_04_HeatTransfer.md`](./recuperator/RECUPERATOR_SPEC_04_HeatTransfer.md) | Nu correlations, gas radiation (Hottel–Mikheev), overall wall HTC |
| [`RECUPERATOR_SPEC_05_RecuperatorAlgorithm.md`](./recuperator/RECUPERATOR_SPEC_05_RecuperatorAlgorithm.md) | Counter-flow HX optimiser, 8-neighbour grid search, energy balance |
| [`RECUPERATOR_SPEC_06_FurnaceAlgorithm.md`](./recuperator/RECUPERATOR_SPEC_06_FurnaceAlgorithm.md) | Multilayer radial FD, brentq on inner surface temperature, outer surface cooling |
| [`RECUPERATOR_SPEC_07_API.md`](./recuperator/RECUPERATOR_SPEC_07_API.md) | All 4 endpoint specs with full DTOs |
| [`RECUPERATOR_SPEC_08_Bibliography.md`](./recuperator/RECUPERATOR_SPEC_08_Bibliography.md) | Mikheev 1977, Gnielinski, Hottel, Churchill–Chu |

### Combustion — [`combustion/`](./combustion/)
**Role:** Fuel combustion in four modes on one absolute-enthalpy balance and one product-equilibrium routine

| File | Contents |
|---|---|
| [`README.md`](./combustion/README.md) | Modes at a glance, service map, units, known limitations |
| [`01_SharedPhysics.md`](./combustion/01_SharedPhysics.md) | NASA-7 absolute enthalpy, fuel ΔHf ⇄ LHV, verified fuel data, element balance, WGS equilibrium, brentq flame solver, constants |
| [`02_Mode1_SolidDirect.md`](./combustion/02_Mode1_SolidDirect.md) | One-step solid combustion (λ < 1, = 1, > 1) |
| [`03_Mode2_TwoStep.md`](./combustion/03_Mode2_TwoStep.md) | Generator gas at computed T_step1 + secondary-air burnout |
| [`04_Mode3_Fluid.md`](./combustion/04_Mode3_Fluid.md) | Gaseous (species, hydrocarbon gases, MAP-Pro preset) and liquid (elemental) fuels |
| [`05_Mode4_Bed.md`](./combustion/05_Mode4_Bed.md) | Packed bed by layers: legacy kinetics, Thiele η, ignited char root, Gunn/Ergun, wall losses, steam |
| [`06_API.md`](./combustion/06_API.md) | All endpoints with full request/response DTOs, defaults, errors |
| [`07_RecuperatorFlueGas.md`](./combustion/07_RecuperatorFlueGas.md) | `CombustionService.flueGas()`: combustion mode selected by the recuperator, flue gas, air preheat offset, smoke start temperature |

---

## Component Effects System

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

## Data Structures

### ComponentEffect Interface

```typescript
export interface ComponentEffect {
  name: string;
  formula: string;
  category: 'oxide-former' | 'oxide-modifier' | 'fluoride' | 'chloride';
  classification: 'network-former' | 'network-modifier' | 'flux' | 'destabilizer';
  refractorinessEffect: number;          // K
  liquidusEffect: number;                // K
  viscosityEffect?: number;              // K
  meltingPoint_C?: number;               // °C
  liquidEnrichmentFactor?: number;       // 0.1-2.5
  solidEnrichmentFactor?: number;        // 0.1-1.0
  description?: string;
}
```

---

## Theoretical Foundations

### References Used

1. **Kingery et al. (1976)**
   - "Introduction to Ceramics, 2nd Edition"
   - Fundamental phase diagrams
   - Component effect values

2. **Lee & Rainforth (1994)**
   - "Ceramic Microstructures"
   - Crystal structures
   - Phase formation kinetics

3. **Schacht (2004)**
   - "Refractories Handbook"
   - Industrial applications
   - Practical limitations

4. **NIST Phase Diagram Database**
   - Binary and ternary systems
   - Validated phase boundaries
   - Liquidus temperatures

5. **American Ceramic Society**
   - Phase diagram compilations
   - Standard test methods
   - Material property data

### Physical Principles

#### Gibbs Free Energy Minimization
Phases form where ΔG is minimum:
```
ΔG = ΔH - TΔS
```

At equilibrium: dG/dx = 0 (phase boundaries)

#### Phase Diagrams
Two or more components create phase regions:
- Single-phase regions
- Two-phase coexistence regions
- Eutectic/peritectic points

#### Lever Rule
In two-phase regions:
```
%Phase1 = (overall - Phase2) / (Phase1 - Phase2) × 100
```

---

## Validation & Accuracy

### Validation Data

All algorithms validated against:

| Source | Coverage | Accuracy |
|--------|----------|----------|
| Literature | All phases | ±50°C |
| CAS Database | Melting points | ±20°C |
| Industrial data | Refractoriness | ±100°C |
| Phase diagrams | Compositions | ±2-5% |

### Known Limitations

1. **Assumes equilibrium** - Kinetic barriers not modeled
2. **No metastable phases** - Only stable phases predicted
3. **Linear composition effects** - Non-linear interactions ignored
4. **Standard conditions** - Special conditions not handled
5. **No microstructure** - Porosity and grain size ignored

### Accuracy by Composition Type

| Type | Accuracy | Notes |
|------|----------|-------|
| Binary (2 oxides) | ±30°C | Excellent |
| Ternary (3 oxides) | ±50°C | Good |
| Quaternary+ | ±100°C | Approximate |
| With fluxes | ±80°C | Moderate |
| Extreme comp. | ±150°C | Poor |

---

## Integration Architecture

### Service Dependencies

```
RefractorinessService
  ↓
  ├─→ MixCompositionService (fired composition)
  └─→ phase-diagram utils (equilibrium of one composition)

PhaseEquilibriumService
  ↓
  ├─→ Component Effects System (calculateLiquidusEffect)
  └─→ Component Effects System (enrichment factors)

ViscosityService
  ↓
  └─→ Component Effects System (calculateViscosityEffect)
```

### Data Flow

```
User Input (Composition)
  ↓
  └─→ Component Effects System
       ├─→ Phase Equilibrium Service → Liquid/Solid composition
       └─→ Viscosity Service → Melt viscosity
```

---

## Future Extensions

### Planned Enhancements

1. **Kinetic modeling**
   - Formation rates for phases
   - Activation energies
   - Time-temperature diagrams

2. **Solid solutions**
   - Partial miscibility
   - Solid solution ranges
   - Composition dependence

3. **Additional properties**
   - Thermal conductivity
   - Mechanical properties
   - Chemical durability

4. **Advanced phases**
   - Liquid (glassy) phases
   - Non-stoichiometric compounds
   - Metastable phases

5. **Machine learning**
   - Phase prediction from ML models
   - Property estimation
   - Composition optimization

---

## File Organization

### Algorithm documentation (`docs/algorithms/`)
```
docs/algorithms/
├── README.md                              ← this file (index)
│
├── ── Refractory ──────────────────────────────────────────
├── phase-equilibrium/
│   ├── FULL_PHASE_EQUILIBRIUM.md
│   ├── MINERAL_PHASE_IDENTIFICATION.md
│   ├── REFRACTORINESS_ALGORITHM.md
│   └── COMPONENT_EFFECTS.md
├── mix/
│   ├── MIX_COMPOSITION_ALGORITHM.md
│   └── MIX_THERMAL_ALGORITHM.md
├── blend-optimizer/
│   ├── BLEND_OPTIMIZER_ALGORITHM.md
│   ├── BLEND_OPTIMIZER_FIXED_FRACTIONS.md
│   ├── BLEND_OPTIMIZER_INPUT_OUTPUT_DEMO.md
│   ├── COMPONENT_SPECIFIC_THRESHOLDS.md
│   ├── VIABLE_COMPOSITION_RANGES.md
│   └── VIABLE_RANGE_OUTPUT_FORMAT.md
├── particle-packing/
│   ├── PACKING_MODELS.md
│   ├── PSD_ALGORITHMS.md
│   ├── WATER_DEMAND_ALGORITHM.md
│   └── SHRINKAGE_CALCULATOR_ALGORITHM.md
├── glass-viscosity/                       (14 chapters)
│
├── ── Heat transfer ───────────────────────────────────────
├── heat-conduction/
├── heat-transfer-coefficient/
├── recuperator/
├── combustion/
│
└── ── Thermal Distribution (planned) ─────────────────────
    thermal-distribution/                  ⚠️ spec only — not yet implemented
```

### Thermodynamics service docs (`docs/services/`)
```
docs/services/
├── THERMODYNAMICS_SERVICES.md     ← service method reference (formulas, correlations)
└── COMMON_THERMAL_LIBRARY.md      ← compound registry, NASA-7/9, resolver, utils
```

### Thermodynamics implementation planning (`docs/migration/thermodynamics/`)
```
docs/migration/thermodynamics/
├── README.md                       ← migration document index
├── CH01_SCOPE.md                   ← scope and legacy sources
├── CH02_FILE_STRUCTURE.md          ← file layout decisions
├── CH03_SERVICE_DECOMPOSITION.md   ← service boundaries
├── CH04_CP_RESOLUTION.md           ← Cp resolution strategy  
├── CH05_DTOS.md                    ← DTO design
├── CH06_NESTJS_REGISTRATION.md     ← module registration
├── CH07_APPENDIX_CORRELATIONS.md   ← correlation appendix
├── CH07_DIMENSIONLESS_NUMBERS.md   ← dimensionless number spec
└── CHECKLIST.md                    ← implementation checklist
```

### Implementation locations
```
backend/src/modules/refractory/       ← Refractory services + constants
backend/src/modules/thermodynamics/   ← Thermodynamics services + controllers
backend/src/common/thermal/           ← Shared compound data + utils
```

---

## Status

**Last Updated:** May 2026

| Domain | Algorithms documented | Implementation | Tests |
|---|---|---|---|
| Refractory — core | ✅ 5 full docs | ✅ 11 services | ⚠️ Partial |
| Refractory — additional | ✅ 11 docs (`phase-equilibrium/`, `mix/`, `blend-optimizer/`, `particle-packing/`) + `glass-viscosity/` | ✅ Implemented | ⚠️ Partial |
| Thermodynamics | ✅ This index + [service ref](../services/THERMODYNAMICS_SERVICES.md) | ✅ 8 services | ⚠️ Partial |
| Common thermal library | ✅ [COMMON_THERMAL_LIBRARY.md](../services/COMMON_THERMAL_LIBRARY.md) | ✅ 16 compounds | ✅ |
| Thermal distribution | ✅ 12 spec files (planned only) | ❌ Not started | ❌ |

**Updates May 2026:**
- ✅ Thermodynamics algorithms section added (gas properties, dimensionless numbers, radiation)
- ✅ `thermal-distribution/` section added with link to all 12 spec files
- ✅ All file references corrected to actual existing filenames (removed phantom `phase-equilibrium.md` etc.)
- ✅ `docs/migration/thermodynamics/` planning docs indexed
- ✅ Service docs moved from `docs/api/` to `docs/services/`
