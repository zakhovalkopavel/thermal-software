# No Hardcoded Values, DTOs, and SOLID

**Parent index:** [CODE_QUALITY_STANDARDS.md](./CODE_QUALITY_STANDARDS.md)

---

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
