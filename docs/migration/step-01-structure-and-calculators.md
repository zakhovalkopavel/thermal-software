# Refractory Module Structure and Calculator Mapping

**Parent index:** [STEP_01_REFRACTORY_MODULE.md](./STEP_01_REFRACTORY_MODULE.md)

---

```
backend/src/modules/refractory/
├── refractory.module.ts                    # Module definition
├── dto/
│   ├── phase-equilibrium.dto.ts           # Phase calculation DTOs
│   ├── blend-optimization.dto.ts          # Blend optimizer DTOs
│   ├── packing-calculation.dto.ts         # Packing DTOs
│   ├── shrinkage-prediction.dto.ts        # Shrinkage DTOs
│   ├── glass-viscosity.dto.ts             # Viscosity DTOs
│   ├── refractoriness.dto.ts              # Refractoriness DTOs
│   └── common.dto.ts                      # Shared DTOs (OxideComposition, etc.)
├── entities/
│   ├── material.entity.ts                 # Material database entity
│   ├── mix-preset.entity.ts               # Mix library entity
│   └── eutectic-data.entity.ts            # Phase diagram data entity
├── services/
│   ├── phase-equilibrium.service.ts       # FROM: PhaseEquilibriumCalculator.ts
│   ├── blend-optimizer.service.ts         # FROM: BlendOptimizer.ts
│   ├── psd-calculator.service.ts          # FROM: PSDCalculator.ts
│   ├── packing.service.ts                 # FROM: PackingCalculator.ts
│   ├── shrinkage.service.ts               # FROM: ShrinkageCalculator.ts
│   ├── glass-viscosity.service.ts         # FROM: GlassViscosityCalculator.ts
│   ├── viscosity.service.ts               # FROM: ViscosityCalculator.ts
│   ├── refractoriness.service.ts          # FROM: RefractorinessStandardsCalculator.ts
│   ├── mineral-phase.service.ts           # FROM: MineralPhaseIdentifier.ts
│   ├── thermal-performance.service.ts     # FROM: ThermalPerformanceCalculator.ts
│   └── participation.service.ts           # FROM: ParticipationCalculator.ts
├── controllers/
│   ├── refractory.controller.ts           # Main API controller
│   └── material-library.controller.ts     # Material CRUD operations
├── repositories/
│   ├── material.repository.ts             # Material data access
│   └── phase-diagram.repository.ts        # Phase diagram data access
└── data/
    └── eutectic-systems.data.ts           # Static phase diagram data
```

---

## Calculator Mapping (11 Calculators)

### 1. PhaseEquilibriumCalculator.ts → phase-equilibrium.service.ts

**Legacy:** `legacy/refractory/src/calculators/PhaseEquilibriumCalculator.ts` (276 lines)

**Purpose:** Calculate liquid-solid phase distribution at temperature

**Key Methods:**
- `calculateLiquidSolidSplit()` - Main calculation
- `estimateLiquidus()` - Liquidus temperature estimation
- `calculateLiquidComposition()` - Liquid phase composition
- `calculateSolidComposition()` - Solid phase composition

**Dependencies:**
- `PhaseDiagramRepository` → `phase-diagram.repository.ts`
- `MineralPhaseIdentifier` → `mineral-phase.service.ts`
- `BaseCalculator` → Remove (use NestJS patterns)

**API Endpoint:**
```typescript
POST /api/v1/refractory/phase-equilibrium
Body: {
  composition: { SiO2: 50.5, Al2O3: 30.2, CaO: 10.5, ... },
  temperature: 1450,
  totalMass: 100
}
Response: {
  liquid: { percent, mass, composition },
  solid: { percent, mass, composition, mineralPhases },
  metadata: { ... }
}
```

---

### 2. BlendOptimizer.ts → blend-optimizer.service.ts

**Legacy:** `legacy/refractory/src/calculators/BlendOptimizer.ts` (346 lines)

**Purpose:** Optimize particle size distribution blends

**Key Methods:**
- `optimize()` - Main optimization with multiple scenarios
- `calculateProperties()` - Calculate complete blend properties
- `calculateSkeletalDensity()` - Density calculations
- `estimateCementContent()` - Cement estimation

**Dependencies:**
- `PSDCalculator` → `psd-calculator.service.ts`
- `PackingCalculator` → `packing.service.ts`
- `ShrinkageCalculator` → `shrinkage.service.ts`
- `MaterialLibrary` → `material.repository.ts`

**API Endpoint:**
```typescript
POST /api/v1/refractory/blend-optimization
Body: {
  fractions: [
    { materialId: "...", dMin_mm: 0.1, dMax_mm: 1.0, isFixed: false }
  ],
  options: {
    qValues: [0.25, 0.27, 0.30],
    methods: ["Andreasen", "FunkDinger"],
    scenarios: ["Self-compacting", "Flowable"]
  }
}
Response: [
  {
    method, q, scenario, packingModel,
    massFractions, packingFraction, shrinkage, ...
  }
]
```

---

### 3. PSDCalculator.ts → psd-calculator.service.ts

**Legacy:** `legacy/refractory/src/calculators/PSDCalculator.ts`

**Purpose:** Particle size distribution calculations

**Key Methods:**
- `andreasenDiscrete()` - Andreasen model
- `funkDingerDiscrete()` - Funk-Dinger model
- `calculateCumulative()` - Cumulative distribution

**API Endpoint:**
```typescript
POST /api/v1/refractory/psd-calculation
```

---

### 4. PackingCalculator.ts → packing.service.ts

**Legacy:** `legacy/refractory/src/calculators/PackingCalculator.ts`

**Purpose:** Packing density calculations

**Key Methods:**
- `calculateCPM()` - Compressible Packing Model (de Larrard)
- `calculateFurnas()` - Furnas sequential filling

**API Endpoint:**
```typescript
POST /api/v1/refractory/packing-calculation
```

---

### 5. ShrinkageCalculator.ts → shrinkage.service.ts

**Legacy:** `legacy/refractory/src/calculators/ShrinkageCalculator.ts`

**Purpose:** Shrinkage prediction

**Key Methods:**
- `calculateCompleteShrinkage()` - Complete shrinkage profile
- `calculateChemicalShrinkage()` - Chemical shrinkage
- `calculateMSC()` - Master Sintering Curve

**API Endpoint:**
```typescript
POST /api/v1/refractory/shrinkage-prediction
```

---

### 6. GlassViscosityCalculator.ts → glass-viscosity.service.ts

**Legacy:** `legacy/refractory/src/calculators/GlassViscosityCalculator.ts`

**Purpose:** Glass viscosity at fixed points

**Key Methods:**
- `calculateViscosity()` - Viscosity calculation
- `getFixedPoints()` - ASTM C965 fixed points

**API Endpoint:**
```typescript
POST /api/v1/refractory/glass-viscosity
```

---

### 7. ViscosityCalculator.ts → viscosity.service.ts

**Legacy:** `legacy/refractory/src/calculators/ViscosityCalculator.ts`

**Purpose:** General viscosity models

**API Endpoint:**
```typescript
POST /api/v1/refractory/viscosity
```

---

### 8. RefractorinessStandardsCalculator.ts → refractoriness.service.ts

**Legacy:** `legacy/refractory/src/calculators/RefractorinessStandardsCalculator.ts`

**Purpose:** Refractoriness by multiple standards

**Key Methods:**
- Calculate refractoriness (EN ISO 1893, ASTM C24/C71, GOST 4069-69)

**API Endpoint:**
```typescript
POST /api/v1/refractory/refractoriness
```

---

### 9. MineralPhaseIdentifier.ts → mineral-phase.service.ts

**Legacy:** `legacy/refractory/src/calculators/MineralPhaseIdentifier.ts`

**Purpose:** Identify mineral phases from composition

**Key Methods:**
- `identifyPhases()` - Identify phases (Mullite, Corundum, Anorthite, etc.)

**Used by:** Phase equilibrium, thermal performance

---

### 10. ThermalPerformanceCalculator.ts → thermal-performance.service.ts

**Legacy:** `legacy/refractory/src/calculators/ThermalPerformanceCalculator.ts`

**Purpose:** Thermal conductivity and performance

**API Endpoint:**
```typescript
POST /api/v1/refractory/thermal-performance
```

---

### 11. ParticipationCalculator.ts → participation.service.ts

**Legacy:** `legacy/refractory/src/calculators/ParticipationCalculator.ts`

**Purpose:** Participation calculations

**API Endpoint:**
```typescript
POST /api/v1/refractory/participation
```

---
