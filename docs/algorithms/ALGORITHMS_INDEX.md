# Algorithms Documentation Index

**Date:** February 2, 2026  
**Version:** 2.0 - Complete Algorithm Library  
**Status:** Production-Ready

---

## 📚 AVAILABLE ALGORITHMS

### 1. **Viscosity (Melt / Glass)** ⭐
**Services:** `GlassViscosityService` (glass compositions), melt viscosity integrated in `PhaseEquilibriumService`  
**Model:** Arrhenius (melt) + VFT / Lakatos / Fluegel (glass)

**Algorithm documents:**
- **[`MULTI_MODEL_COMPLETE.md`](./MULTI_MODEL_COMPLETE.md)** — multi-model viscosity comparison
- **[`glass-viscosity/INDEX.md`](./glass-viscosity/INDEX.md)** — 14-chapter glass viscosity specification (VFT, Lakatos, Fluegel, composition encoding, confidence)

**Resources:**
- Urbain et al. (1982) - Base model
- Mills (1993) - Comprehensive slag data
- Giordano et al. (2008) - VFT model
- Lakatos (1976) - Glass composition model
- Fluegel (2007) - Large-dataset regression

**Key Features:**
- Network former/modifier classification
- Component effect quantification
- Fluoride and chloride support
- Industrial validation
- ✅ Production-ready

---

### 2. **THERMAL_PERFORMANCE_ALGORITHM.md** ⭐ NEW
**Service:** `ThermalPerformanceService`  
**Components:** 33 (21 oxides + 6 fluorides + 6 chlorides)  
**Model:** Composition-Weighted with Temperature & Porosity Corrections  

**Resources:**
- Kingery et al. (1976) - Ceramic thermal properties
- Schacht (2004) - Refractory handbook
- Maxwell & Eucken - Porosity equations
- TPRC Database - Thermophysical properties

**Key Features:**
- Thermal conductivity by component
- Temperature dependence (-0.0003 K⁻¹)
- Maxwell-Eucken porosity correction
- Thermal diffusivity calculation
- ✅ Production-ready

---

### 3. **REFRACTORINESS_ALGORITHM.md** ⭐ NEW
**Service:** `RefractorinessService`  
**Components:** 33 (21 oxides + 6 fluorides + 6 chlorides)  
**Model:** Component-Based Temperature Estimation  

**Resources:**
- ISO 1893:2015 - RUL standard
- ASTM C24-10 - PCE standard
- Mills (1993) - Refractory handbook
- GOST 4069-69 - Russian standard

**Key Features:**
- Network former/modifier effects (+800 to -900 K)
- Fluoride flux components
- Chloride destabilizer components
- 4 standard support (ISO, ASTM, GOST)
- Classification by duty level
- ✅ Production-ready

---

### 4. **FULL_PHASE_EQUILIBRIUM.md**
**Service:** `PhaseEquilibriumService`  
**Model:** Thermodynamic phase calculation  

**Contents:**
- Phase equilibrium principles
- Liquid-solid distribution
- Temperature-dependent calculations
- Material composition analysis

---

### 3. **PACKING_MODELS.md**
**Services:** `PackingService`  
**Models:** CPM (Compressible Packing Model) and Furnas  

**Contents:**
- Packing density calculations
- Particle size distribution effects
- Compaction modeling
- Industrial validation

---

### 4. **PSD_ALGORITHMS.md**
**Service:** `PSDCalculatorService`  
**Models:** Andreasen, Funk-Dinger  

**Contents:**
- Particle size distribution
- Optimal grading calculations
- Aggregate sizing

---

### 5. **MULTI_MODEL_COMPLETE.md**
**Multi-Service Overview**  
**Coverage:** All calculation models integrated

**Contents:**
- Complete workflow integration
- Data dependencies
- Cross-service communication

---

## 🔗 SERVICE INTERCONNECTIONS

```
Material Library (Composition Data)
        ↓
        ├→ ViscosityService → η (Pa·s)
        ├→ PhaseEquilibriumService → Phase composition
        ├→ PackingService → Packing density
        ├→ PSDCalculatorService → Particle distribution
        ├→ ShrinkageService → Shrinkage %
        ├→ RefractorinessService → Refractory performance
        ├→ ThermalPerformanceService → Thermal properties
        └→ GlassViscosityService → Glass viscosity
```

---

## 📊 ALGORITHM COMPARISON

| Algorithm | Model Type | Components | Accuracy | Range |
|-----------|-----------|-----------|----------|-------|
| Viscosity | Arrhenius | 33 | ±10-20% | 1000-2000°C |
| Thermal Performance | Weighted avg + corrections | 33 | ±15-25% | 20-2000°C |
| Refractoriness | Component-based | 33 | ±50-100°C | 800-2500°C |
| Phase Equilibrium | Thermodynamic | All | ±5% | All temps |
| Packing | Empirical | All | ±15% | All sizes |
| PSD | Mathematical | All | ±3% | All sizes |

---

## 🎯 QUICK ACCESS

### By Service:
- **Melt Viscosity** → `MULTI_MODEL_COMPLETE.md`
- **Glass Viscosity** → `glass-viscosity/INDEX.md`
- **Phase Equilibrium** → `FULL_PHASE_EQUILIBRIUM.md`
- **Packing Density** → `PACKING_MODELS.md`
- **Particle Size** → `PSD_ALGORITHMS.md`

### By Application:
- **Refractory Design** → All documents
- **Glass Calculation** → Viscosity, Phase Equilibrium
- **Ceramic Processing** → Viscosity, Packing, PSD
- **Thermal Analysis** → Phase Equilibrium

---

## 🔍 RESOURCE MAPPING

### Data Sources Used:

**Academic References:**
1. Urbain et al. (1982) - Silicate melt viscosity
2. Mills (1993) - Slag Atlas
3. Giordano et al. (2008) - Magmatic liquids model
4. Dingwell & Webb (1990) - Silicate relaxation

**Databases:**
- PubChem (NIST) - Component properties
- Materials Project (LBNL) - Material data
- FactSage - Phase data (commercial)
- NIST Chemistry WebBook - Thermodynamics

**Standards:**
- ASTM C965 - Viscosity measurement
- ISO 6337 - Viscosity determination

---

## ✅ VALIDATION STATUS

| Algorithm | Validated | Tested | Production | Date |
|-----------|-----------|--------|-----------|------|
| Melt Viscosity (Arrhenius) | ✅ | ✅ | ✅ | Feb 2, 2026 |
| Glass Viscosity (VFT/Lakatos/Fluegel) | ✅ | ✅ | ✅ | Feb 2, 2026 |
| Phase Equilibrium | ✅ | ✅ | ✅ | Earlier |
| Packing | ✅ | ✅ | ✅ | Earlier |
| PSD | ✅ | ✅ | ✅ | Earlier |

---

## 📝 UPDATE HISTORY

### February 2, 2026
- ✅ Updated viscosity section — replaced phantom `VISCOSITY_ALGORITHM.md` with `MULTI_MODEL_COMPLETE.md` + `glass-viscosity/INDEX.md`
- ✅ Documented 33 components (21 oxides + 6 fluorides + 6 chlorides)
- ✅ Added resource citations
- ✅ Created algorithms index

### Earlier (Legacy)
- Phase equilibrium algorithms
- Packing density models
- PSD calculations

---

## 🆕 BLEND OPTIMIZATION & PACKING

### **BLEND_OPTIMIZER_ALGORITHM.md** ⭐ COMPLETE
**Service:** `BlendOptimizerService`  
**Integration:** PSD + Packing + Shrinkage + Water Demand  

**Resources:**
- de Larrard, F. (1999) - CPM Model
- Funk & Dinger (1994) - PSD Optimization
- Banerjee, S. (2004) - Refractory Castables

**Key Features:**
- Andreasen & Funk-Dinger PSD methods
- CPM & Furnas packing models
- Multiple compaction scenarios
- Shrinkage prediction integration
- Water demand calculation
- ✅ Production-ready

---

### **BLEND_OPTIMIZER_FIXED_FRACTIONS.md** ⭐ NEW
**Feature:** Fixed Fractions & Optimization Goals  

**Key Features:**
- Fixed fraction support (e.g., "exactly 15% CAC")
- 5 optimization goals (maxDensity, minPorosity, minWater, minShrinkage, balanced)
- Constraint filtering (min packing, max water, max porosity)
- Result ranking and scoring
- Top N results selection
- Multiple optimal solutions
- ✅ Production-ready

**Usage Examples:**
- Fixed cement with max density optimization
- Minimum water demand with constraints
- Balanced optimization for general use
- Solution ranges (top 10-20 results)

---

### **WATER_DEMAND_ALGORITHM.md** ⭐ COMPLETE
**Service:** `WaterDemandService`  

**Resources:**
- de Larrard (1999) - Water-void relationship
- Banerjee (2004) - Refractory workability
- Pileggi et al. (2001) - Rheology studies

**Key Features:**
- 3 workability types (FIRM, STANDARD, FLOWABLE)
- Water demand = 30-50% of porosity (not 100%)
- Workability factor-based calculation
- Porosity conversion utilities
- Validation methods
- ✅ Production-ready with 35 tests

---

### **PACKING_MODELS.md** ⭐ COMPLETE
**Service:** `PackingService`  

**Resources:**
- de Larrard (1999) - CPM Model
- Furnas (1931) - Sequential filling
- Fennis (2011) - Calibration parameters

**Key Features:**
- CPM (Compressible Packing Model)
- Furnas (Sequential filling)
- Adaptive β₀ (particle shape models)
- Adaptive φ_max (composition-based limits)
- Micro-filler detection
- Pressure-dependent compaction
- ✅ Production-ready

---

---

## 🌡️ HEAT CONDUCTION & HEAT TRANSFER COEFFICIENT

### **heat-conduction/** ⭐ NEW
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

---

### **heat-transfer-coefficient/** ⭐ NEW
**Role:** Multi-regime HTC orchestrator — entry point for $\alpha(T_s)$ calculation used by the heat conduction solver
**Regimes:** Film boiling → Nucleate boiling → Single-phase convection

| File | Contents |
|---|---|
| [`HTC_00_REGIMES_OVERVIEW.md`](./heat-transfer-coefficient/HTC_00_REGIMES_OVERVIEW.md) | **Entry point.** Regime routing state machine, Leidenfrost / CHF2 switching boundaries |
| [`HTC_01_CRITICAL_FLUX.md`](./heat-transfer-coefficient/HTC_01_CRITICAL_FLUX.md) | Critical Heat Flux (CHF) and Minimum Heat Flux (MHF): Zuber, Kutateladze-Borishanskii, Kandlikar, Henry/Berenson models |
| [`HTC_02_FILM_BOILING.md`](./heat-transfer-coefficient/HTC_02_FILM_BOILING.md) | Film boiling: Leidenfrost marker, Bromley conductive film, Klimenko universal correlation, orientation routing |
| [`HTC_03_NUCLEATE_BOILING.md`](./heat-transfer-coefficient/HTC_03_NUCLEATE_BOILING.md) | Nucleate boiling: Labuntsov, Rohsenow, Kutateladze, Stephan-Abdelsalam, Cooper, Yang-Maas, Kovalev models |

---

## 🎊 STATUS

**All algorithms documented and production-ready!**

For implementation details, see individual algorithm files in this directory.



