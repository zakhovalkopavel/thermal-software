# Test Types and Coverage Requirements

**Parent index:** [TEST_SPECIFICATION.md](./TEST_SPECIFICATION.md)

---

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
