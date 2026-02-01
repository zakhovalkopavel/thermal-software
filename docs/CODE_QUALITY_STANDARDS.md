# Development Principles & Code Quality Standards

**Version:** 1.0.0  
**Date:** February 1, 2026  
**Status:** Mandatory for all development

---

## Overview

This document defines the mandatory development principles and code quality standards for the Thermal Software project. **ALL code must follow these principles.**

---

## 1. NO Hardcoded Values

### ❌ BAD - Hardcoded Values
```typescript
// services/calculation.service.ts
export class CalculationService {
  calculate() {
    const maxTemp = 1500;  // ❌ Hardcoded!
    const tolerance = 0.001;  // ❌ Hardcoded!
    const apiUrl = 'http://localhost:4000';  // ❌ Hardcoded!
  }
}
```

### ✅ GOOD - Configuration Files
```typescript
// config/calculation.constants.ts
export const CALCULATION_CONSTANTS = {
  maxTemperature: 1500,  // Celsius
  minTemperature: -273.15,  // Absolute zero in Celsius
  defaultTolerance: 0.001,
  maxIterations: 1000,
} as const;

// config/api.config.ts
export const API_CONFIG = {
  baseUrl: process.env.API_URL || 'http://localhost:4000',
  timeout: parseInt(process.env.API_TIMEOUT, 10) || 5000,
  retries: parseInt(process.env.API_RETRIES, 10) || 3,
} as const;

// services/calculation.service.ts
import { CALCULATION_CONSTANTS } from '../config/calculation.constants';

export class CalculationService {
  calculate() {
    const maxTemp = CALCULATION_CONSTANTS.maxTemperature;
    const tolerance = CALCULATION_CONSTANTS.defaultTolerance;
  }
}
```

### Configuration File Locations
```
backend/src/config/
├── constants.ts              # General constants
├── calculation.constants.ts  # Calculation-specific
├── database.constants.ts     # Database-specific
└── api.config.ts            # API configuration

frontend/src/config/
├── constants.ts              # General constants
├── api.config.ts            # API endpoints
└── ui.constants.ts          # UI-specific (colors, sizes)

shared/constants/
└── domain.constants.ts      # Shared business domain constants
```

---

## 2. Data Transfer Objects (DTOs)

### Purpose
- Validate all inputs at API boundary
- Define clear contracts between layers
- Enable automatic documentation (Swagger)
- Type safety across application

### ✅ Always Use DTOs for:
- API request bodies
- API responses
- Data passed between services
- Form submissions

### Example Structure
```typescript
// modules/calculations/dto/create-calculation.dto.ts
import { IsString, IsNumber, IsArray, Min, Max, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class MaterialDto {
  @ApiProperty({ description: 'Material name' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Material percentage', minimum: 0, maximum: 100 })
  @IsNumber()
  @Min(0)
  @Max(100)
  percentage: number;
}

export class CreateCalculationDto {
  @ApiProperty({ description: 'Calculation name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Temperature in Celsius' })
  @IsNumber()
  @Min(-273.15)
  @Max(3000)
  temperature: number;

  @ApiProperty({ type: [MaterialDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MaterialDto)
  materials: MaterialDto[];
}

// modules/calculations/dto/calculation-response.dto.ts
export class CalculationResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  result: number;

  @ApiProperty()
  createdAt: Date;
}
```

---

## 3. SOLID Principles

### Single Responsibility Principle (SRP)
**One class = One reason to change**

❌ **BAD:**
```typescript
// One class doing too much
export class CalculationService {
  calculate() { /* ... */ }
  saveToDatabase() { /* ... */ }
  sendEmail() { /* ... */ }
  generatePDF() { /* ... */ }
}
```

✅ **GOOD:**
```typescript
// Each class has single responsibility
export class CalculationService {
  constructor(
    private readonly calculationEngine: CalculationEngine,
    private readonly repository: CalculationRepository,
    private readonly notificationService: NotificationService,
  ) {}

  async calculate(dto: CreateCalculationDto) {
    const result = this.calculationEngine.compute(dto);
    await this.repository.save(result);
    await this.notificationService.notify(result);
    return result;
  }
}

export class CalculationEngine {
  compute(dto: CreateCalculationDto): CalculationResult {
    // Pure calculation logic
  }
}
```

### Open/Closed Principle (OCP)
**Open for extension, closed for modification**

✅ **GOOD:**
```typescript
// Interface for calculation strategies
export interface ICalculationStrategy {
  calculate(input: CalculationInput): CalculationResult;
}

// Base implementation
export class StandardCalculationStrategy implements ICalculationStrategy {
  calculate(input: CalculationInput): CalculationResult {
    // Standard calculation
  }
}

// Extension without modifying base
export class AdvancedCalculationStrategy implements ICalculationStrategy {
  calculate(input: CalculationInput): CalculationResult {
    // Advanced calculation
  }
}

// Service uses interface
export class CalculationService {
  constructor(private strategy: ICalculationStrategy) {}
  
  calculate(input: CalculationInput) {
    return this.strategy.calculate(input);
  }
}
```

### Liskov Substitution Principle (LSP)
**Derived classes must be substitutable for base classes**

### Interface Segregation Principle (ISP)
**Many specific interfaces > One general interface**

✅ **GOOD:**
```typescript
// Specific interfaces
export interface ICalculatable {
  calculate(): CalculationResult;
}

export interface ISaveable {
  save(): Promise<void>;
}

export interface IValidatable {
  validate(): boolean;
}

// Classes implement only what they need
export class SimpleCalculation implements ICalculatable {
  calculate(): CalculationResult { /* ... */ }
}

export class PersistentCalculation implements ICalculatable, ISaveable {
  calculate(): CalculationResult { /* ... */ }
  save(): Promise<void> { /* ... */ }
}
```

### Dependency Inversion Principle (DIP)
**Depend on abstractions, not concretions**

✅ **GOOD:**
```typescript
// Depend on interface (abstraction)
export class CalculationService {
  constructor(
    private readonly repository: ICalculationRepository,  // ← Interface
    private readonly logger: ILogger,  // ← Interface
  ) {}
}

// Interface definition
export interface ICalculationRepository {
  save(calculation: Calculation): Promise<void>;
  findById(id: string): Promise<Calculation>;
}

// Concrete implementation
export class TypeOrmCalculationRepository implements ICalculationRepository {
  save(calculation: Calculation): Promise<void> { /* ... */ }
  findById(id: string): Promise<Calculation> { /* ... */ }
}
```

---

## 4. OOP Organization

### Module Structure
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

