# Test Implementation Order and Structure Standards

**Parent index:** [TEST_SPECIFICATION.md](./TEST_SPECIFICATION.md)

---

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
