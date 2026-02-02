# STEP 06: Testing

**Priority:** HIGH  
**Complexity:** MEDIUM  
**Estimated Time:** 1 week  
**Dependencies:** All modules implemented

---

## Testing Strategy

### 1. Unit Tests (Backend)

**Target:** 80%+ coverage

#### Refractory Module
```typescript
// refractory/services/phase-equilibrium.service.spec.ts
describe('PhaseEquilibriumService', () => {
  it('should calculate liquid fraction correctly', () => {
    // Test with known inputs/outputs from legacy
  });

  it('should identify mineral phases', () => {
    // Test mineral identification
  });

  it('should throw error for invalid composition', () => {
    // Test validation
  });
});
```

#### Furnace Module
```typescript
// furnace/services/combustion.service.spec.ts
describe('CombustionService', () => {
  it('should calculate stoichiometric air', () => {
    // Test calculations
  });
});
```

---

### 2. Integration Tests (Backend)

```typescript
// refractory/refractory.controller.e2e.spec.ts
describe('RefractoryController (e2e)', () => {
  it('/POST phase-equilibrium', () => {
    return request(app.getHttpServer())
      .post('/api/v1/refractory/phase-equilibrium')
      .send({
        composition: { SiO2: 50.5, Al2O3: 30.2, CaO: 10.5, MgO: 5.0, Fe2O3: 2.8 },
        temperature: 1450,
      })
      .expect(200)
      .expect((res) => {
        expect(res.body.liquid).toBeDefined();
        expect(res.body.solid).toBeDefined();
      });
  });
});
```

---

### 3. Frontend Tests

```typescript
// PhaseCalculator.test.tsx
describe('PhaseCalculator', () => {
  it('should render form', () => {
    render(<PhaseCalculator />);
    expect(screen.getByText('Phase Equilibrium Calculator')).toBeInTheDocument();
  });

  it('should submit calculation', async () => {
    // Test form submission
  });

  it('should display results', async () => {
    // Test results display
  });
});
```

---

### 4. E2E Tests

```typescript
// e2e/phase-equilibrium.e2e.ts
describe('Phase Equilibrium Workflow', () => {
  it('should complete full calculation workflow', () => {
    cy.visit('/refractory/phase-calculator');
    cy.get('[data-testid="sio2-input"]').type('50.5');
    cy.get('[data-testid="al2o3-input"]').type('30.2');
    // ...
    cy.get('[data-testid="calculate-button"]').click();
    cy.get('[data-testid="results"]').should('be.visible');
  });
});
```

---

## Implementation Steps

### Step 1: Unit Tests - Backend (16 hours)
- [ ] Phase equilibrium service tests
- [ ] Blend optimizer tests
- [ ] Packing calculator tests
- [ ] Shrinkage calculator tests
- [ ] All other service tests

### Step 2: Integration Tests - Backend (8 hours)
- [ ] Refractory controller tests
- [ ] Furnace controller tests
- [ ] Material library tests
- [ ] Database integration tests

### Step 3: Unit Tests - Frontend (12 hours)
- [ ] Component tests
- [ ] Hook tests
- [ ] Utility tests

### Step 4: E2E Tests (8 hours)
- [ ] Phase calculator workflow
- [ ] Blend optimizer workflow
- [ ] Material library workflow

### Step 5: Validation Testing (8 hours)
- [ ] Compare results with legacy system
- [ ] Performance testing
- [ ] Load testing
- [ ] Cross-browser testing

**Total:** 52 hours (1 week)

---

**Next:** [IMPLEMENTATION_STATUS.md](IMPLEMENTATION_STATUS.md)

