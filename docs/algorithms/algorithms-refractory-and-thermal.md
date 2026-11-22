# Refractory and Thermal Distribution Algorithm Notes

**Parent index:** [README.md](./README.md)

---

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
