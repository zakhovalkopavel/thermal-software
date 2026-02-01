# Test Specification - Complete Coverage Requirements

**Version:** 1.0.0  
**Date:** February 1, 2026  
**Status:** Mandatory for All Code

---

## Overview

**ALL code must be tested before merging.**

This document defines:
- Test coverage requirements
- Test types and structure
- Implementation order
- Verification procedures

---

## Coverage Requirements

### Minimum Coverage Thresholds

| Code Type | Minimum Coverage | Target Coverage |
|-----------|------------------|-----------------|
| **Services** | 80% | 90% |
| **Utilities** | 80% | 90% |
| **Controllers** | 70% | 80% |
| **DTOs** | 100% (validation) | 100% |
| **Overall Project** | 75% | 85% |

**Enforcement:**
- CI/CD pipeline blocks merge if coverage < minimum
- Code review must verify coverage
- Coverage reports saved to `tmp/reports/tests/`

---

## Test Types

### 1. Unit Tests

**Purpose:** Test individual functions/methods in isolation

**Coverage:** Services, utilities, helpers, calculators

**Example Structure:**
```
backend/src/modules/calculations/
├── services/
│   ├── calculation.service.ts
│   └── calculation.service.spec.ts      # ← Unit tests
├── utils/
│   ├── thermal-calculator.ts
│   └── thermal-calculator.spec.ts       # ← Unit tests
```

**Example Test:**
```typescript
// calculation.service.spec.ts
describe('CalculationService', () => {
  let service: CalculationService;
  let mockRepository: jest.Mocked<ICalculationRepository>;

  beforeEach(() => {
    mockRepository = createMockRepository();
    service = new CalculationService(mockRepository);
  });

  describe('calculateThermalExpansion', () => {
    it('should calculate correctly for positive temperature', () => {
      const result = service.calculateThermalExpansion({
        material: 'Steel',
        initialTemp: 20,
        finalTemp: 100,
        length: 1000,
      });
      
      expect(result).toBeCloseTo(0.96, 2);
    });

    it('should throw for invalid temperature', () => {
      expect(() => {
        service.calculateThermalExpansion({
          material: 'Steel',
          initialTemp: -300, // Below absolute zero
          finalTemp: 100,
          length: 1000,
        });
      }).toThrow('Invalid temperature');
    });
  });
});
```

**Requirements:**
- Mock all dependencies
- Test happy path and error cases
- Test boundary conditions
- Coverage ≥80%

---

### 2. Integration Tests

**Purpose:** Test multiple components working together

**Coverage:** API endpoints, database operations, external services

**Example Structure:**
```
backend/src/modules/calculations/
├── controllers/
│   ├── calculation.controller.ts
│   └── calculation.controller.spec.ts   # ← Integration tests
```

**Example Test:**
```typescript
// calculation.controller.spec.ts
describe('CalculationController (Integration)', () => {
  let app: INestApplication;
  let repository: Repository<Calculation>;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = module.createNestApplication();
    await app.init();
    
    repository = module.get('CalculationRepository');
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /calculations', () => {
    it('should create calculation and return result', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/calculations')
        .send({
          name: 'Test Calculation',
          materials: [
            { name: 'Al2O3', percentage: 60 },
            { name: 'SiO2', percentage: 40 },
          ],
          temperature: 1500,
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe('Test Calculation');
      
      // Verify in database
      const saved = await repository.findOne({ where: { id: response.body.id } });
      expect(saved).toBeDefined();
    });

    it('should reject invalid materials sum', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/calculations')
        .send({
          name: 'Test',
          materials: [
            { name: 'Al2O3', percentage: 60 },
            { name: 'SiO2', percentage: 30 }, // Only 90%!
          ],
          temperature: 1500,
        })
        .expect(400);
    });
  });
});
```

**Requirements:**
- Test actual HTTP requests
- Verify database operations
- Test authentication/authorization
- Coverage ≥70%

---

### 3. End-to-End (E2E) Tests

**Purpose:** Test complete user workflows

**Coverage:** Critical business processes

**Example Structure:**
```
backend/test/
├── e2e/
│   ├── auth.e2e-spec.ts
│   ├── calculation-workflow.e2e-spec.ts
│   └── user-management.e2e-spec.ts
```

**Example Test:**
```typescript
// calculation-workflow.e2e-spec.ts
describe('Calculation Workflow (E2E)', () => {
  let app: INestApplication;
  let authToken: string;

  beforeAll(async () => {
    // Setup application
    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = module.createNestApplication();
    await app.init();

    // Login and get token
    const loginResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ username: 'testuser', password: 'password' });
    
    authToken = loginResponse.body.access_token;
  });

  it('complete calculation workflow', async () => {
    // 1. Create calculation
    const createResponse = await request(app.getHttpServer())
      .post('/api/v1/calculations')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'E2E Test Calculation',
        materials: [{ name: 'Al2O3', percentage: 100 }],
        temperature: 1600,
      })
      .expect(201);

    const calculationId = createResponse.body.id;

    // 2. Get calculation
    const getResponse = await request(app.getHttpServer())
      .get(`/api/v1/calculations/${calculationId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(getResponse.body.name).toBe('E2E Test Calculation');

    // 3. Update calculation
    await request(app.getHttpServer())
      .patch(`/api/v1/calculations/${calculationId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ temperature: 1700 })
      .expect(200);

    // 4. Delete calculation
    await request(app.getHttpServer())
      .delete(`/api/v1/calculations/${calculationId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(204);

    // 5. Verify deleted
    await request(app.getHttpServer())
      .get(`/api/v1/calculations/${calculationId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(404);
  });
});
```

**Requirements:**
- Test complete user flows
- Include authentication
- Test error scenarios
- Cover critical paths

---

### 4. DTO Validation Tests

**Purpose:** Ensure all inputs are validated

**Coverage:** 100% of all DTOs

**Example:**
```typescript
// create-calculation.dto.spec.ts
describe('CreateCalculationDto', () => {
  let validator: Validator;

  beforeEach(() => {
    validator = new Validator();
  });

  describe('name validation', () => {
    it('should accept valid name', async () => {
      const dto = new CreateCalculationDto();
      dto.name = 'Test Calculation';
      dto.materials = [{ name: 'Al2O3', percentage: 100 }];
      dto.temperature = 1500;

      const errors = await validator.validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should reject empty name', async () => {
      const dto = new CreateCalculationDto();
      dto.name = '';
      dto.materials = [{ name: 'Al2O3', percentage: 100 }];
      dto.temperature = 1500;

      const errors = await validator.validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('name');
    });
  });

  describe('temperature validation', () => {
    it('should reject below absolute zero', async () => {
      const dto = new CreateCalculationDto();
      dto.name = 'Test';
      dto.materials = [{ name: 'Al2O3', percentage: 100 }];
      dto.temperature = -300; // Below -273.15

      const errors = await validator.validate(dto);
      expect(errors.find(e => e.property === 'temperature')).toBeDefined();
    });

    it('should reject above max', async () => {
      const dto = new CreateCalculationDto();
      dto.name = 'Test';
      dto.materials = [{ name: 'Al2O3', percentage: 100 }];
      dto.temperature = 5000; // Above max

      const errors = await validator.validate(dto);
      expect(errors.find(e => e.property === 'temperature')).toBeDefined();
    });
  });
});
```

**Requirements:**
- Test all validation decorators
- Test boundary conditions
- Coverage: 100%

---

## Implementation Order (MANDATORY)

### Phase 1: Test Specification (BEFORE Coding)

**Create test spec file:**
```bash
# Create spec document
cat > tmp/reports/tests/FEATURE_NAME_TEST_SPEC.md << 'EOF'
# Test Specification: Feature Name

## Unit Tests
- [ ] Service method A
- [ ] Service method B
- [ ] Utility function C

## Integration Tests
- [ ] POST /api/v1/endpoint
- [ ] GET /api/v1/endpoint/:id
- [ ] PATCH /api/v1/endpoint/:id

## E2E Tests
- [ ] Complete workflow

## Coverage Target: 85%
EOF
```

**Review and approve** before writing code.

---

### Phase 2: Write Tests (TDD - Test-Driven Development)

**1. Write failing tests first:**
```typescript
// calculation.service.spec.ts
describe('CalculationService', () => {
  it('should calculate thermal expansion', () => {
    const service = new CalculationService();
    const result = service.calculateThermalExpansion({...});
    expect(result).toBe(expectedValue);
  });
});
```

**Run test:**
```bash
docker-compose exec backend npm run test -- calculation.service.spec
# ❌ Test fails (method not implemented)
```

**2. Implement code to pass tests:**
```typescript
// calculation.service.ts
calculateThermalExpansion(params): number {
  // Implementation
  return result;
}
```

**Run test:**
```bash
docker-compose exec backend npm run test -- calculation.service.spec
# ✅ Test passes
```

**3. Refactor (if needed)**

Improve code while keeping tests passing.

---

### Phase 3: Verify Coverage

```bash
# Run coverage report
docker-compose exec backend npm run test:cov

# Save report
docker-compose exec backend npm run test:cov > tmp/reports/tests/coverage-$(date +%Y%m%d).txt

# Check coverage meets requirements
# Services: ≥80%
# Utilities: ≥80%
# Overall: ≥75%
```

---

### Phase 4: Code Review

**Checklist:**
- [ ] All tests pass
- [ ] Coverage meets requirements
- [ ] Tests cover edge cases
- [ ] Tests are maintainable
- [ ] No skipped tests without reason

---

## Test Structure Standards

### Naming Convention

```
backend/src/modules/[module]/
├── [name].service.ts
├── [name].service.spec.ts        # ← Unit tests
├── [name].controller.ts
└── [name].controller.spec.ts     # ← Integration tests

backend/test/
└── e2e/
    └── [workflow].e2e-spec.ts    # ← E2E tests
```

### Test File Template

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { ServiceName } from './service-name.service';

describe('ServiceName', () => {
  let service: ServiceName;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ServiceName],
    }).compile();

    service = module.get<ServiceName>(ServiceName);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('methodName', () => {
    it('should handle valid input', () => {
      // Arrange
      const input = { /* test data */ };
      
      // Act
      const result = service.methodName(input);
      
      // Assert
      expect(result).toBe(expectedValue);
    });

    it('should handle invalid input', () => {
      const input = { /* invalid data */ };
      
      expect(() => service.methodName(input)).toThrow();
    });

    it('should handle edge case', () => {
      // Test boundary conditions
    });
  });
});
```

---

## Running Tests

### All Tests
```bash
# Inside Docker (always)
docker-compose exec backend npm run test

# Watch mode (during development)
docker-compose exec backend npm run test:watch

# Specific file
docker-compose exec backend npm run test -- calculation.service.spec
```

### Coverage
```bash
# Generate coverage report
docker-compose exec backend npm run test:cov

# View coverage HTML
docker-compose exec backend npm run test:cov -- --coverage
# Then open: backend/coverage/lcov-report/index.html
```

### E2E Tests
```bash
# Run E2E tests
docker-compose exec backend npm run test:e2e

# Specific E2E test
docker-compose exec backend npm run test:e2e -- calculation-workflow
```

### Save Results
```bash
# Save all test results
docker-compose exec backend npm run test:cov > tmp/reports/tests/coverage-$(date +%Y%m%d).txt

# Save specific module
docker-compose exec backend npm run test -- calculations > tmp/reports/tests/calculations-test-$(date +%Y%m%d).txt
```

---

## CI/CD Integration

### Pre-Merge Checks

```yaml
# .github/workflows/test.yml (example)
steps:
  - name: Run tests
    run: docker-compose exec -T backend npm run test:cov
    
  - name: Check coverage
    run: |
      COVERAGE=$(docker-compose exec -T backend npm run test:cov -- --silent | grep "Statements" | awk '{print $3}')
      if [ ${COVERAGE%\%} -lt 75 ]; then
        echo "❌ Coverage ${COVERAGE} < 75%"
        exit 1
      fi
```

---

## Examples by Module

### Calculations Module

**Test Spec:** `tmp/reports/tests/CALCULATIONS_TEST_SPEC.md`

**Unit Tests:**
- `calculation.service.spec.ts`
  - calculateThermalExpansion()
  - calculateShrinkage()
  - validateMaterialsSum()

**Integration Tests:**
- `calculation.controller.spec.ts`
  - POST /calculations
  - GET /calculations/:id
  - PATCH /calculations/:id
  - DELETE /calculations/:id

**E2E Tests:**
- `calculation-workflow.e2e-spec.ts`
  - Create → Read → Update → Delete

**Coverage Target:** 85%

---

### Authentication Module

**Test Spec:** `tmp/reports/tests/AUTH_TEST_SPEC.md`

**Unit Tests:**
- `auth.service.spec.ts`
  - validateUser()
  - generateToken()
  - verifyToken()
  - hashPassword()

**Integration Tests:**
- `auth.controller.spec.ts`
  - POST /auth/login
  - POST /auth/register
  - POST /auth/refresh
  - POST /auth/logout

**E2E Tests:**
- `auth-flow.e2e-spec.ts`
  - Register → Login → Access Protected → Refresh → Logout

**Coverage Target:** 90% (security critical)

---

## Troubleshooting

### Tests Fail Locally

```bash
# Clean and rebuild
docker-compose down
docker-compose up --build backend

# Clear jest cache
docker-compose exec backend npm run test -- --clearCache

# Run specific test
docker-compose exec backend npm run test -- --verbose [filename]
```

### Coverage Not Updating

```bash
# Remove coverage directory
docker-compose exec backend rm -rf coverage

# Run tests again
docker-compose exec backend npm run test:cov
```

### E2E Tests Timeout

```bash
# Increase timeout in test file
jest.setTimeout(30000); // 30 seconds

# Or in jest.config.js
module.exports = {
  testTimeout: 30000,
};
```

---

## Summary

### Mandatory Requirements

| Requirement | Status | Verification |
|-------------|--------|--------------|
| **Test spec BEFORE coding** | ✅ Enforced | Review process |
| **Services ≥80% coverage** | ✅ Enforced | CI/CD check |
| **Utilities ≥80% coverage** | ✅ Enforced | CI/CD check |
| **DTOs 100% validated** | ✅ Enforced | Code review |
| **All tests pass** | ✅ Enforced | CI/CD check |
| **Tests in Docker** | ✅ Enforced | NO local npm |

### Implementation Flow

```
1. Create Test Spec (tmp/reports/tests/FEATURE_TEST_SPEC.md)
   ↓
2. Write Failing Tests
   ↓
3. Implement Code to Pass Tests
   ↓
4. Verify Coverage ≥ Minimum
   ↓
5. Code Review
   ↓
6. Merge (if all checks pass)
```

---

**ALL code must be tested. NO exceptions.**

Tests ensure code quality, prevent regressions, and document expected behavior.

