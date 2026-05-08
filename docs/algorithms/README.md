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

1. **[Component Effects System](./COMPONENT_EFFECTS.md)** ✅ NEW
   - Central data-driven architecture for all component calculations
   - 33 chemical components with 5+ properties each
   - Automatic iteration through components
   - Used by all calculation services

2. **[Mineral Phase Identification](./MINERAL_PHASE_IDENTIFICATION.md)** ✅ EXPANDED
   - 17 distinct mineral phases identification
   - Temperature-dependent phase formation
   - Stoichiometric calculations
   - Phases: Mullite, Corundum, Spinel, Forsterite, Periclase, Zirconia, etc.

3. **[Refractoriness Algorithm](./REFRACTORINESS_ALGORITHM.md)** ✅ MERGED & COMPREHENSIVE
   - **Complete documentation** combining implementation + academic reference
   - ISO 1893, ASTM C24, GOST 4069 standards
   - Component effects (33 components: oxides, fluorides, chlorides)
   - Step-by-step calculation procedure
   - 4 practical worked examples
   - Validation & accuracy metrics
   - 10+ peer-reviewed references

4. **[Blend Optimizer Algorithm](./BLEND_OPTIMIZER_ALGORITHM.md)** ✅ NEW
   - Multi-stage PSD optimization
   - Integration of PSD + Packing + Shrinkage
   - 4 compaction scenarios (Self-compacting to Hand-pressable)
   - 64+ optimization combinations evaluated
   - Complete workflow documentation

5. **[Shrinkage Calculator Algorithm](./SHRINKAGE_CALCULATOR_ALGORITHM.md)** ✅ NEW
   - Chemical shrinkage model (drying phase)
   - Master Sintering Curve (MSC) model (firing phase)
   - Two-stage shrinkage prediction
   - Temperature-dependent calculations
   - ±5% accuracy for typical refractories

### 🔬 Additional Refractory Algorithms

| File | Topic | Status |
|------|-------|--------|
| [`FULL_PHASE_EQUILIBRIUM.md`](./FULL_PHASE_EQUILIBRIUM.md) | Liquid-solid partitioning, eutectic, lever rule | ✅ |
| [`PACKING_MODELS.md`](./PACKING_MODELS.md) | CPM and Furnas packing density models | ✅ |
| [`THERMAL_PERFORMANCE_ALGORITHM.md`](./THERMAL_PERFORMANCE_ALGORITHM.md) | Effective thermal conductivity with porosity | ✅ |
| [`WATER_DEMAND_ALGORITHM.md`](./WATER_DEMAND_ALGORITHM.md) | Water demand from packing fraction | ✅ |
| [`PSD_ALGORITHMS.md`](./PSD_ALGORITHMS.md) | Andreasen and Funk-Dinger PSD models | ✅ |
| [`MULTI_MODEL_COMPLETE.md`](./MULTI_MODEL_COMPLETE.md) | Multi-model viscosity comparison | ✅ |
| [`COMPONENT_SPECIFIC_THRESHOLDS.md`](./COMPONENT_SPECIFIC_THRESHOLDS.md) | Per-component validity thresholds | ✅ |
| [`VIABLE_COMPOSITION_RANGES.md`](./VIABLE_COMPOSITION_RANGES.md) | Composition feasibility ranges | ✅ |
| [`VIABLE_RANGE_OUTPUT_FORMAT.md`](./VIABLE_RANGE_OUTPUT_FORMAT.md) | Output format for viable range results | ✅ |
| [`BLEND_OPTIMIZER_FIXED_FRACTIONS.md`](./BLEND_OPTIMIZER_FIXED_FRACTIONS.md) | Fixed fractions & optimization goals | ✅ |
| [`BLEND_OPTIMIZER_INPUT_OUTPUT_DEMO.md`](./BLEND_OPTIMIZER_INPUT_OUTPUT_DEMO.md) | Blend optimizer I/O examples | ✅ |
| [`glass-viscosity/INDEX.md`](./glass-viscosity/INDEX.md) | Glass viscosity: Lakatos, Fluegel, VFT fitting | ✅ |

---

## 🌡️ Thermal Distribution Algorithms

Specification for temperature field and thermal distribution calculations (not yet implemented in backend).

**Sub-directory:** [`thermal-distribution/`](./thermal-distribution/)

| Spec file | Topic |
|-----------|-------|
| [`THERMAL_DISTRIBUTION_SPEC_00_Overview.md`](./thermal-distribution/THERMAL_DISTRIBUTION_SPEC_00_Overview.md) | Scope and design goals |
| [`THERMAL_DISTRIBUTION_SPEC_01_Geometries.md`](./thermal-distribution/THERMAL_DISTRIBUTION_SPEC_01_Geometries.md) | Supported geometries |
| [`THERMAL_DISTRIBUTION_SPEC_02_Methods_A_Spectral.md`](./thermal-distribution/THERMAL_DISTRIBUTION_SPEC_02_Methods_A_Spectral.md) | Spectral method |
| [`THERMAL_DISTRIBUTION_SPEC_03_Methods_B_Power.md`](./thermal-distribution/THERMAL_DISTRIBUTION_SPEC_03_Methods_B_Power.md) | Power-series method |
| [`THERMAL_DISTRIBUTION_SPEC_04_Methods_ProductSolution.md`](./thermal-distribution/THERMAL_DISTRIBUTION_SPEC_04_Methods_ProductSolution.md) | Product-solution method |
| [`THERMAL_DISTRIBUTION_SPEC_05_VolumeAverage.md`](./thermal-distribution/THERMAL_DISTRIBUTION_SPEC_05_VolumeAverage.md) | Volume-average temperature |
| [`THERMAL_DISTRIBUTION_SPEC_06_API.md`](./thermal-distribution/THERMAL_DISTRIBUTION_SPEC_06_API.md) | Planned API design |
| [`THERMAL_DISTRIBUTION_SPEC_07_Calibration.md`](./thermal-distribution/THERMAL_DISTRIBUTION_SPEC_07_Calibration.md) | Calibration strategy |
| [`THERMAL_DISTRIBUTION_SPEC_08_Bibliography.md`](./thermal-distribution/THERMAL_DISTRIBUTION_SPEC_08_Bibliography.md) | References |
| [`THERMAL_DISTRIBUTION_SPEC_09_Validation.md`](./thermal-distribution/THERMAL_DISTRIBUTION_SPEC_09_Validation.md) | Validation approach |
| [`THERMAL_DISTRIBUTION_SPEC_10_Examples.md`](./thermal-distribution/THERMAL_DISTRIBUTION_SPEC_10_Examples.md) | Worked examples |
| [`THERMAL_DISTRIBUTION_SPEC_11_QuickReference.md`](./thermal-distribution/THERMAL_DISTRIBUTION_SPEC_11_QuickReference.md) | Quick reference |

> ⚠️ **Not yet implemented.** These are design specifications only — no backend service exists yet.  
> When implementation begins, create `backend/src/modules/thermal-distribution/` and add an entry to `IMPLEMENTATION_STATUS.md`.

---

## Component Effects System

**File:** `COMPONENT_EFFECTS.md`

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
calculateRefractorinessEffect(composition)      // → number (K)
calculateLiquidusEffect(composition)             // → number (K)
calculateViscosityEffect(composition)            // → number (K)
calculateLiquidCompositionWithEnrichment(comp)  // → Record<string, number>
calculateSolidCompositionWithEnrichment(comp)   // → Record<string, number>
```

### Service Integration

**RefractorinessService:**
```typescript
const effectFromComponents = calculateRefractorinessEffect(composition);
refractorinessTemp += effectFromComponents;
```

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

**File:** `MINERAL_PHASE_IDENTIFICATION.md`

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

**File:** [`REFRACTORINESS_ALGORITHM.md`](./REFRACTORINESS_ALGORITHM.md)

### Algorithm

```
RT = Base_Temperature (1400°C)
   + Σ(Component_Effect × Wt% / 100)
   + Standard-specific transformation (ISO 1893, ASTM C24, GOST 4069)
```

### Standards Supported

#### ISO 1893 - RUL (Refractoriness Under Load)
Three deformation points at 0.2 MPa load:
- **T0.5:** Temperature for 0.5mm deformation
- **T1:** Temperature for 1mm deformation
- **T2:** Temperature for 2mm deformation (full refractoriness)

#### ASTM C24 - PCE (Pyrometric Cone Equivalent)
Maps temperature to cone numbers (Cone 26-42):
- Visual comparison with standard pyrometric cones
- Resolution: ~30°C per cone
- Cone 30 ≈ 1723°C, Cone 35 ≈ 1835°C

#### GOST 4069 - Russian Standard
Similar to PCE but Russian cone scale.

### Component Effects

**Strongest Effects:**
- **Na2O:** -900K (strongest flux)
- **AL2O3:** +800K (strongest former)
- **K2O, LI2O:** -850K, -800K (strong fluxes)
- **Fluorides:** -850K to -280K (all fluxes)

### Physical Constraints
- Minimum RT: 1200°C
- Maximum RT: 1900°C
- Valid composition range: 99-101% total

### Example Calculation

**Chamotte (45% Al2O3, 38% SiO2, 8% Fe2O3, 4% TiO2):**
```
RT = 1400 + (0.45×800) + (0.38×500) + (0.08×-450) + (0.04×400)
   = 1400 + 360 + 190 - 36 + 16
   = 1930°C (Cone 35-36)
```

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
- Phase identification from Mineral Phase Service

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

### MineralPhase Structure

```typescript
{
  phase: string;           // Phase name
  formula: string;         // Chemical formula
  percent: number;         // Amount formed (%)
  meltingPoint: number;    // Melting point (°C)
  description: string;     // Physical description
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
  └─→ Component Effects System (calculateRefractorinessEffect)

PhaseEquilibriumService
  ↓
  ├─→ Component Effects System (calculateLiquidusEffect)
  ├─→ Component Effects System (enrichment factors)
  └─→ Mineral Phase Service (for comparison)

ViscosityService
  ↓
  └─→ Component Effects System (calculateViscosityEffect)

MineralPhaseService
  ↓
  └─→ (Independent)
```

### Data Flow

```
User Input (Composition)
  ↓
  ├─→ Component Effects System
  │    ├─→ Refractoriness Service → RT calculation
  │    ├─→ Phase Equilibrium Service → Liquid/Solid composition
  │    └─→ Viscosity Service → Melt viscosity
  │
  └─→ Mineral Phase Service → Phase identification
       ├─→ 17 phases with properties
       └─→ Stability ranges
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
├── COMPONENT_EFFECTS.md                   ✅
├── MINERAL_PHASE_IDENTIFICATION.md        ✅
├── REFRACTORINESS_ALGORITHM.md            ✅
├── BLEND_OPTIMIZER_ALGORITHM.md           ✅
├── BLEND_OPTIMIZER_FIXED_FRACTIONS.md     ✅
├── BLEND_OPTIMIZER_INPUT_OUTPUT_DEMO.md   ✅
├── SHRINKAGE_CALCULATOR_ALGORITHM.md      ✅
├── FULL_PHASE_EQUILIBRIUM.md              ✅
├── PACKING_MODELS.md                      ✅
├── THERMAL_PERFORMANCE_ALGORITHM.md       ✅
├── WATER_DEMAND_ALGORITHM.md              ✅
├── PSD_ALGORITHMS.md                      ✅
├── MULTI_MODEL_COMPLETE.md                ✅
├── COMPONENT_SPECIFIC_THRESHOLDS.md       ✅
├── VIABLE_COMPOSITION_RANGES.md           ✅
├── VIABLE_RANGE_OUTPUT_FORMAT.md          ✅
├── ALGORITHMS_INDEX.md                    ✅
├── glass-viscosity/                       ✅  (14 chapters)
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
| Refractory — additional | ✅ 14 docs (real file names) | ✅ Implemented | ⚠️ Partial |
| Thermodynamics | ✅ This index + [service ref](../services/THERMODYNAMICS_SERVICES.md) | ✅ 8 services | ⚠️ Partial |
| Common thermal library | ✅ [COMMON_THERMAL_LIBRARY.md](../services/COMMON_THERMAL_LIBRARY.md) | ✅ 16 compounds | ✅ |
| Thermal distribution | ✅ 12 spec files (planned only) | ❌ Not started | ❌ |

**Updates May 2026:**
- ✅ Thermodynamics algorithms section added (gas properties, dimensionless numbers, radiation)
- ✅ `thermal-distribution/` section added with link to all 12 spec files
- ✅ All file references corrected to actual existing filenames (removed phantom `phase-equilibrium.md` etc.)
- ✅ `docs/migration/thermodynamics/` planning docs indexed
- ✅ Service docs moved from `docs/api/` to `docs/services/`
