# Data Structures, Theory, Validation, Integration, and File Organization

**Parent index:** [README.md](./README.md)

---

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
