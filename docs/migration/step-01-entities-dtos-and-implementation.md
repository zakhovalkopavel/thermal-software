# Refractory Entities, DTOs, Repositories, and Implementation Steps

**Parent index:** [STEP_01_REFRACTORY_MODULE.md](./STEP_01_REFRACTORY_MODULE.md)

---

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
