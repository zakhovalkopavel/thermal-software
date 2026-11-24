# OOP Organization, Testing, Review, and Migration

**Parent index:** [CODE_QUALITY_STANDARDS.md](./CODE_QUALITY_STANDARDS.md)

---

### Module Structure

> **Mandatory layout.** Each construct lives in its own folder with its own suffix, one construct per
> file. Full mapping (types, enums, constants, data, utils, …) and placement rules:
> [`CONVENTIONS.md`](./CONVENTIONS.md) § Construct → folder → file → export.
> The tree below shows the core folders only.

```
backend/src/modules/[feature]/
├── entities/
│   └── [feature].entity.ts           # Database entity (TypeORM)
├── dto/
│   ├── create-[feature].dto.ts       # Input DTO
│   ├── update-[feature].dto.ts       # Update DTO
│   └── [feature]-response.dto.ts     # Output DTO
├── interfaces/
│   ├── [feature].interface.ts        # Domain interface
│   └── [feature]-repository.interface.ts  # Repository contract
├── services/
│   ├── [feature].service.ts          # Business logic
│   └── [feature].service.spec.ts     # Unit tests
├── controllers/
│   ├── [feature].controller.ts       # HTTP endpoints (thin!)
│   └── [feature].controller.spec.ts  # Integration tests
├── repositories/
│   └── [feature].repository.ts       # Data access
└── [feature].module.ts               # NestJS module
```

### Controller Rules
**Controllers must be THIN - NO business logic!**

❌ **BAD:**
```typescript
@Controller('calculations')
export class CalculationController {
  @Post()
  create(@Body() dto: CreateCalculationDto) {
    // ❌ Business logic in controller!
    const result = dto.materials.reduce((sum, m) => sum + m.percentage, 0);
    if (result !== 100) throw new Error('Must equal 100%');
    
    const calculation = new Calculation();
    calculation.name = dto.name;
    // ... more logic
    
    return calculation;
  }
}
```

✅ **GOOD:**
```typescript
@Controller('calculations')
export class CalculationController {
  constructor(private readonly service: CalculationService) {}

  @Post()
  async create(@Body() dto: CreateCalculationDto) {
    // ✅ Delegate to service
    return this.service.create(dto);
  }
}

// Business logic in service
export class CalculationService {
  async create(dto: CreateCalculationDto): Promise<CalculationResponseDto> {
    this.validateMaterialsSum(dto.materials);
    const calculation = await this.repository.create(dto);
    return this.toResponseDto(calculation);
  }

  private validateMaterialsSum(materials: MaterialDto[]): void {
    const sum = materials.reduce((total, m) => total + m.percentage, 0);
    if (Math.abs(sum - 100) > 0.01) {
      throw new BadRequestException('Material percentages must sum to 100%');
    }
  }
}
```

---

## 5. Testing Requirements

### Coverage Requirements
- **Services:** ≥80% line coverage
- **Utilities:** ≥80% line coverage
- **Controllers:** ≥70% line coverage (integration tests)
- **Overall:** ≥75% line coverage

### Test Types

#### Unit Tests
```typescript
// calculation.service.spec.ts
describe('CalculationService', () => {
  let service: CalculationService;
  let mockRepository: jest.Mocked<ICalculationRepository>;

  beforeEach(() => {
    mockRepository = {
      save: jest.fn(),
      findById: jest.fn(),
    };
    service = new CalculationService(mockRepository);
  });

  describe('create', () => {
    it('should create calculation when materials sum to 100%', async () => {
      const dto: CreateCalculationDto = {
        name: 'Test',
        temperature: 1500,
        materials: [
          { name: 'Al2O3', percentage: 60 },
          { name: 'SiO2', percentage: 40 },
        ],
      };

      await service.create(dto);

      expect(mockRepository.save).toHaveBeenCalledTimes(1);
    });

    it('should throw when materials dont sum to 100%', async () => {
      const dto: CreateCalculationDto = {
        name: 'Test',
        temperature: 1500,
        materials: [
          { name: 'Al2O3', percentage: 60 },
          { name: 'SiO2', percentage: 30 },  // Only 90%
        ],
      };

      await expect(service.create(dto)).rejects.toThrow();
    });
  });
});
```

#### Integration Tests
```typescript
// calculation.controller.spec.ts
describe('CalculationController (Integration)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = module.createNestApplication();
    await app.init();
  });

  describe('POST /calculations', () => {
    it('should create calculation', () => {
      return request(app.getHttpServer())
        .post('/calculations')
        .send({
          name: 'Test',
          temperature: 1500,
          materials: [
            { name: 'Al2O3', percentage: 60 },
            { name: 'SiO2', percentage: 40 },
          ],
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body.name).toBe('Test');
        });
    });
  });
});
```

### Running Tests
```bash
# All tests
docker-compose exec backend npm run test

# Watch mode
docker-compose exec backend npm run test:watch

# Coverage
docker-compose exec backend npm run test:cov

# Specific file
docker-compose exec backend npm run test -- calculation.service.spec

# Save results
docker-compose exec backend npm run test:cov > tmp/reports/tests/coverage-$(date +%Y%m%d).txt
```

---

## 6. Code Review Checklist

Before merging, verify:

### Structure
- [ ] NO hardcoded values (all in config files)
- [ ] DTOs used for all API inputs/outputs
- [ ] Validation decorators on all DTOs
- [ ] Swagger decorators on DTOs and endpoints

### SOLID Principles
- [ ] Services follow Single Responsibility
- [ ] Dependencies injected via constructor
- [ ] Depends on interfaces, not concrete classes
- [ ] Controllers are thin (delegate to services)

### OOP
- [ ] Clear separation: entities, DTOs, services, controllers
- [ ] Interfaces defined for contracts
- [ ] Proper encapsulation (private methods/properties)

### Testing
- [ ] Unit tests for all services (≥80% coverage)
- [ ] Integration tests for all endpoints
- [ ] All tests pass
- [ ] Test results saved to `tmp/reports/tests/`

### Documentation
- [ ] Swagger docs complete
- [ ] README updated if needed
- [ ] Complex logic has comments

---

## 7. Migration from Legacy Code

### Step 1: Copy Working Models
```bash
# Document what you're copying
echo "Copying models from legacy: $(date)" > tmp/reports/migrations/legacy-adaptation.log

# List models
ls legacy/refractory/src/models/ >> tmp/reports/migrations/legacy-adaptation.log
```

### Step 2: Adapt to New Structure
1. Extract logic from legacy code
2. Create entities (TypeORM)
3. Create DTOs with validation
4. NO business logic changes yet!

### Step 3: Write Tests
1. Write tests for adapted code
2. Ensure behavior matches legacy
3. Document differences

### Step 4: Refactor
1. Apply SOLID principles
2. Remove hardcoded values
3. Improve naming
4. Add proper error handling

**IMPORTANT:** Steps 1-3 are SEPARATE from Step 4!

---

## Enforcement

### CI/CD Pipeline
- Tests must pass
- Coverage must be ≥75%
- No hardcoded values (linter rule)
- DTO validation required

### Code Review
- At least one approval required
- Checklist must be completed
- Tests must be included

---

**All code must follow these principles!**

For questions, see:
- `docs/migration/NESTJS_MIGRATION_SPEC.md` - Complete spec
- `START_HERE.md` - Implementation guide
