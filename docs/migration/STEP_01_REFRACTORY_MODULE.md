# STEP 01: Refractory Module Migration

**Priority:** HIGH  
**Complexity:** MEDIUM  
**Estimated Time:** 1-2 weeks  
**Dependencies:** None

---

## Overview

Migrate the complete refractory calculator suite from `legacy/refractory/` to NestJS backend module.

**Legacy Location:** `legacy/refractory/src/`  
**Target Location:** `backend/src/modules/refractory/`  
**Frontend Target:** `frontend/src/pages/refractory/`

---

## Module Structure

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

## Entities

### 1. Material Entity

```typescript
@Entity('materials')
export class Material {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  type: string; // 'aggregate', 'cement', 'additive'

  @Column('jsonb')
  composition: {
    SiO2?: number;
    Al2O3?: number;
    CaO?: number;
    // ...
  };

  @Column('float')
  rho_true_after_firing_kgm3: number;

  @Column('jsonb')
  particleSize: {
    d10_mm?: number;
    d50_mm?: number;
    d90_mm?: number;
  };

  @Column('jsonb', { nullable: true })
  thermalProperties?: {
    // ...
  };

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

---

### 2. Mix Preset Entity

```typescript
@Entity('mix_presets')
export class MixPreset {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column('text', { nullable: true })
  description: string;

  @Column('jsonb')
  fractions: Array<{
    materialId: string;
    dMin_mm: number;
    dMax_mm: number;
    massFraction: number;
  }>;

  @Column('jsonb')
  properties: {
    packingFraction: number;
    bulkDensity: number;
    // ...
  };

  @Column()
  userId: string; // For user-specific presets

  @CreateDateColumn()
  createdAt: Date;
}
```

---

## DTOs

### Common DTO (Shared)

```typescript
// dto/common.dto.ts
export class OxideCompositionDto {
  @IsNumber() @Min(0) @Max(100) @IsOptional()
  SiO2?: number;

  @IsNumber() @Min(0) @Max(100) @IsOptional()
  Al2O3?: number;

  @IsNumber() @Min(0) @Max(100) @IsOptional()
  CaO?: number;

  @IsNumber() @Min(0) @Max(100) @IsOptional()
  MgO?: number;

  @IsNumber() @Min(0) @Max(100) @IsOptional()
  Fe2O3?: number;

  @IsNumber() @Min(0) @Max(100) @IsOptional()
  K2O?: number;

  @IsNumber() @Min(0) @Max(100) @IsOptional()
  Na2O?: number;

  @IsNumber() @Min(0) @Max(100) @IsOptional()
  TiO2?: number;
}

export class FractionInputDto {
  @IsString()
  materialId: string;

  @IsNumber() @Min(0)
  dMin_mm: number;

  @IsNumber() @Min(0)
  dMax_mm: number;

  @IsBoolean() @IsOptional()
  isFixed?: boolean;
}
```

---

## Repositories

### Material Repository

```typescript
@Injectable()
export class MaterialRepository {
  constructor(
    @InjectRepository(Material)
    private repo: Repository<Material>,
  ) {}

  async findById(id: string): Promise<Material> {
    return this.repo.findOne({ where: { id } });
  }

  async findByType(type: string): Promise<Material[]> {
    return this.repo.find({ where: { type } });
  }

  async create(data: CreateMaterialDto): Promise<Material> {
    const material = this.repo.create(data);
    return this.repo.save(material);
  }

  async findAll(): Promise<Material[]> {
    return this.repo.find();
  }
}
```

---

### Phase Diagram Repository

```typescript
@Injectable()
export class PhaseDiagramRepository {
  // Load static eutectic data
  private eutecticSystems = EUTECTIC_DATA;

  getEutectic(system: string, name: string) {
    return this.eutecticSystems[system]?.[name];
  }

  getAllEutectics(system: string) {
    return this.eutecticSystems[system];
  }
}
```

---

## Implementation Steps

### Step 1: Module Setup (1 hour)
- [x] Create module structure
- [ ] Create refractory.module.ts
- [ ] Register in app.module.ts

### Step 2: Phase Equilibrium (4 hours)
- [ ] Create phase-equilibrium.service.ts
- [ ] Create phase-equilibrium.dto.ts
- [ ] Port logic from PhaseEquilibriumCalculator.ts
- [ ] Create API endpoint in controller
- [ ] Add unit tests

### Step 3: Blend Optimizer (6 hours)
- [ ] Create blend-optimizer.service.ts
- [ ] Create blend-optimization.dto.ts
- [ ] Port logic from BlendOptimizer.ts
- [ ] Integrate PSD, Packing, Shrinkage services
- [ ] Create API endpoint
- [ ] Add unit tests

### Step 4: PSD Calculator (3 hours)
- [ ] Create psd-calculator.service.ts
- [ ] Port Andreasen discrete method
- [ ] Port Funk-Dinger discrete method
- [ ] Create API endpoint
- [ ] Add unit tests

### Step 5: Packing Calculator (3 hours)
- [ ] Create packing.service.ts
- [ ] Port CPM model
- [ ] Port Furnas model
- [ ] Create API endpoint
- [ ] Add unit tests

### Step 6: Shrinkage Calculator (3 hours)
- [ ] Create shrinkage.service.ts
- [ ] Port chemical shrinkage
- [ ] Port MSC model
- [ ] Create API endpoint
- [ ] Add unit tests

### Step 7: Glass Viscosity (2 hours)
- [ ] Create glass-viscosity.service.ts
- [ ] Port viscosity calculations
- [ ] Create API endpoint
- [ ] Add unit tests

### Step 8: Refractoriness (2 hours)
- [ ] Create refractoriness.service.ts
- [ ] Port multiple standards
- [ ] Create API endpoint
- [ ] Add unit tests

### Step 9: Mineral Phase (2 hours)
- [ ] Create mineral-phase.service.ts
- [ ] Port phase identification logic
- [ ] Integrate with phase equilibrium

### Step 10: Entities & Database (4 hours)
- [ ] Create Material entity
- [ ] Create MixPreset entity
- [ ] Create repositories
- [ ] Create migrations
- [ ] Seed sample data

### Step 11: Material Library Controller (3 hours)
- [ ] Create material-library.controller.ts
- [ ] CRUD endpoints for materials
- [ ] CRUD endpoints for mix presets

### Step 12: Integration Testing (4 hours)
- [ ] Test all API endpoints
- [ ] Test service integration
- [ ] Test database operations

**Total Estimated Time:** 37-40 hours (1-2 weeks)

---

## Testing Strategy

### Unit Tests
- Each service: 80%+ coverage
- Test all calculation methods
- Test edge cases

### Integration Tests
- API endpoints
- Database operations
- Service dependencies

### E2E Tests
- Complete workflows
- Multi-service operations

---

## Success Criteria

- [ ] All 11 calculators ported
- [ ] All API endpoints working
- [ ] 80%+ test coverage
- [ ] Swagger documentation complete
- [ ] Database entities created
- [ ] Material library CRUD working

---

**Next:** [STEP_02_FURNACE_MODULE.md](STEP_02_FURNACE_MODULE.md)

