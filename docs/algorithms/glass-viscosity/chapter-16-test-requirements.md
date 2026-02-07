# Chapter 16: Test Requirements

**Part IV: Validation**

---

## Overview

Complete test specification for glass viscosity implementation, following the **Service Test Specification** documented in `docs/SERVICE_TEST_SPEC.md`.

**Test Coverage Target:** 100% of public methods

---

## Test Structure

```
backend/test/unit/refractory/services/
├── glass-viscosity.service.spec.ts              (main tests)
├── glass-viscosity-detection.spec.ts            (system detection)
├── glass-viscosity-calculations.spec.ts         (mathematical methods)
├── glass-viscosity-validation.spec.ts           (validation dataset)
└── glass-viscosity-integration.spec.ts          (end-to-end)

backend/test/unit/common/utils/
└── numerical-methods.util.spec.ts               (Newton-Raphson)
```

---

## Unit Tests: glass-viscosity.service.spec.ts

### Test Suite 1: Composition Normalization

```typescript
describe('GlassViscosityService - Composition Normalization', () => {
  let service: GlassViscosityService;
  
  beforeEach(() => {
    service = new GlassViscosityService();
  });
  
  it('should normalize composition to 100%', () => {
    const input = { SiO2: 36, Na2O: 6, CaO: 5 };
    const normalized = service['normalizeComposition'](input);
    
    const sum = Object.values(normalized).reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(100, 2);
  });
  
  it('should not normalize if already at 100%', () => {
    const input = { SiO2: 72.2, Na2O: 13.4, CaO: 11.2, MgO: 1.5, Al2O3: 1.3, K2O: 0.4 };
    const normalized = service['normalizeComposition'](input);
    
    expect(normalized).toEqual(input);
  });
  
  it('should throw error for empty composition', () => {
    expect(() => {
      service['normalizeComposition']({});
    }).toThrow('Composition cannot be empty');
  });
  
  it('should throw error for all-zero composition', () => {
    expect(() => {
      service['normalizeComposition']({ SiO2: 0, Na2O: 0 });
    }).toThrow('Composition cannot be empty');
  });
});
```

---

### Test Suite 2: System Detection

```typescript
describe('GlassViscosityService - System Detection', () => {
  let service: GlassViscosityService;
  
  beforeEach(() => {
    service = new GlassViscosityService();
  });
  
  it('should detect soda-lime-silica glass', () => {
    const composition = {
      SiO2: 72.2, Na2O: 13.4, CaO: 11.2, MgO: 1.5, Al2O3: 1.3, K2O: 0.4
    };
    
    const model = service['detectViscosityModel'](composition);
    expect(model).toBe(ViscosityModel.SODA_LIME_SILICA);
  });
  
  it('should detect borosilicate glass', () => {
    const composition = {
      SiO2: 80.6, B2O3: 12.9, Al2O3: 2.3, Na2O: 3.9, K2O: 0.3
    };
    
    const model = service['detectViscosityModel'](composition);
    expect(model).toBe(ViscosityModel.BOROSILICATE);
  });
  
  it('should detect pure silica', () => {
    const composition = { SiO2: 99.9, Al2O3: 0.1 };
    
    const model = service['detectViscosityModel'](composition);
    expect(model).toBe(ViscosityModel.PURE_SILICA);
  });
  
  it('should detect lead glass', () => {
    const composition = {
      SiO2: 59, PbO: 24, K2O: 12, Na2O: 4, Al2O3: 1
    };
    
    const model = service['detectViscosityModel'](composition);
    expect(model).toBe(ViscosityModel.LEAD_GLASS);
  });
  
  it('should detect aluminosilicate', () => {
    const composition = {
      SiO2: 62, Al2O3: 20, CaO: 10, MgO: 5, Na2O: 3
    };
    
    const model = service['detectViscosityModel'](composition);
    expect(model).toBe(ViscosityModel.ALUMINOSILICATE);
  });
  
  it('should detect slag system', () => {
    const composition = {
      CaO: 40, SiO2: 35, Al2O3: 12, MgO: 8, FeO: 5
    };
    
    const model = service['detectViscosityModel'](composition);
    expect(model).toBe(ViscosityModel.SLAG_CAO_AL2O3);
  });
  
  it('should fall back to multi-component mixing', () => {
    const composition = {
      SiO2: 45, Al2O3: 15, B2O3: 10, BaO: 10, Na2O: 10, K2O: 5, CaO: 5
    };
    
    const model = service['detectViscosityModel'](composition);
    expect(model).toBe(ViscosityModel.MULTI_COMPONENT_MIXING);
  });
});
```

---

### Test Suite 3: Viscosity Calculations

```typescript
describe('GlassViscosityService - Viscosity Calculations', () => {
  let service: GlassViscosityService;
  
  beforeEach(() => {
    service = new GlassViscosityService();
  });
  
  it('should calculate viscosity for soda-lime glass at working point', () => {
    const composition = {
      SiO2: 72.2, Na2O: 13.4, CaO: 11.2, MgO: 1.5, Al2O3: 1.3, K2O: 0.4
    };
    
    const result = service.calculateViscosity(composition, 1100);
    
    expect(result.viscosity_Pas).toBeGreaterThan(1000);
    expect(result.viscosity_Pas).toBeLessThan(3000);
    expect(result.logViscosity).toBeCloseTo(3.3, 1);
  });
  
  it('should calculate viscosity for borosilicate at working point', () => {
    const composition = {
      SiO2: 80.6, B2O3: 12.9, Al2O3: 2.3, Na2O: 3.9, K2O: 0.3
    };
    
    const result = service.calculateViscosity(composition, 1200);
    
    expect(result.viscosity_Pas).toBeGreaterThan(2000);
    expect(result.viscosity_Pas).toBeLessThan(4000);
    expect(result.logViscosity).toBeCloseTo(3.45, 1);
  });
  
  it('should return correct model type for VFT', () => {
    const composition = {
      SiO2: 72.2, Na2O: 13.4, CaO: 11.2, MgO: 1.5, Al2O3: 1.3, K2O: 0.4
    };
    
    const result = service.calculateViscosity(composition, 1000);
    
    expect(result.model.type).toBe('VFT');
    expect(result.model.systemType).toBe(ViscosityModel.SODA_LIME_SILICA);
    expect(result.model.parameters.T0).toBeDefined();
  });
  
  it('should clamp viscosity to physical range', () => {
    const composition = { SiO2: 99.9, Al2O3: 0.1 };
    
    const resultLow = service.calculateViscosity(composition, 2500);
    expect(resultLow.viscosity_Pas).toBeGreaterThanOrEqual(0.001);
    
    const resultHigh = service.calculateViscosity(composition, 500);
    expect(resultHigh.viscosity_Pas).toBeLessThanOrEqual(1e15);
  });
});
```

---

### Test Suite 4: Fixed Points

```typescript
describe('GlassViscosityService - Fixed Points', () => {
  let service: GlassViscosityService;
  
  beforeEach(() => {
    service = new GlassViscosityService();
  });
  
  it('should calculate all ASTM fixed points', () => {
    const composition = {
      SiO2: 72.2, Na2O: 13.4, CaO: 11.2, MgO: 1.5, Al2O3: 1.3, K2O: 0.4
    };
    
    const result = service.calculateViscosity(composition, 1000);
    
    expect(result.fixedPoints.meltingPoint_C).toBeGreaterThan(1300);
    expect(result.fixedPoints.workingPoint_C).toBeGreaterThan(1000);
    expect(result.fixedPoints.softeningPoint_C).toBeGreaterThan(600);
    expect(result.fixedPoints.annealingPoint_C).toBeGreaterThan(500);
    expect(result.fixedPoints.strainPoint_C).toBeGreaterThan(400);
  });
  
  it('should maintain correct temperature ordering', () => {
    const composition = {
      SiO2: 72.2, Na2O: 13.4, CaO: 11.2, MgO: 1.5, Al2O3: 1.3, K2O: 0.4
    };
    
    const result = service.calculateViscosity(composition, 1000);
    const fp = result.fixedPoints;
    
    expect(fp.meltingPoint_C).toBeGreaterThan(fp.flowPoint_C);
    expect(fp.flowPoint_C).toBeGreaterThan(fp.workingPoint_C);
    expect(fp.workingPoint_C).toBeGreaterThan(fp.softeningPoint_C);
    expect(fp.softeningPoint_C).toBeGreaterThan(fp.annealingPoint_C);
    expect(fp.annealingPoint_C).toBeGreaterThan(fp.strainPoint_C);
  });
  
  it('should match NIST certified values for borosilicate', () => {
    const composition = {
      SiO2: 80.6, B2O3: 12.9, Al2O3: 2.3, Na2O: 3.9, K2O: 0.3
    };
    
    const result = service.calculateViscosity(composition, 1000);
    
    expect(result.fixedPoints.softeningPoint_C).toBeCloseTo(821, 0);
    expect(result.fixedPoints.annealingPoint_C).toBeCloseTo(560, 0);
    expect(result.fixedPoints.strainPoint_C).toBeCloseTo(510, 0);
  });
});
```

---

### Test Suite 5: Validation Status

```typescript
describe('GlassViscosityService - Validation', () => {
  let service: GlassViscosityService;
  
  beforeEach(() => {
    service = new GlassViscosityService();
  });
  
  it('should report HIGH confidence for standard soda-lime', () => {
    const composition = {
      SiO2: 72.2, Na2O: 13.4, CaO: 11.2, MgO: 1.5, Al2O3: 1.3, K2O: 0.4
    };
    
    const result = service.calculateViscosity(composition, 1000);
    
    expect(result.validation.confidenceLevel).toBe(ConfidenceLevel.HIGH);
    expect(result.validation.extrapolationRisk).toBe(ExtrapolationRisk.NONE);
    expect(result.validation.warnings).toHaveLength(0);
  });
  
  it('should warn when composition outside validated range', () => {
    const composition = {
      SiO2: 85, Na2O: 12, CaO: 3  // SiO2 too high
    };
    
    const result = service.calculateViscosity(composition, 1000);
    
    expect(result.validation.confidenceLevel).not.toBe(ConfidenceLevel.HIGH);
    expect(result.validation.warnings.length).toBeGreaterThan(0);
    expect(result.validation.warnings[0]).toContain('SiO2');
  });
  
  it('should warn about boron anomaly region', () => {
    const composition = {
      SiO2: 75, B2O3: 12, Na2O: 6, K2O: 2, Al2O3: 5
    };
    
    const result = service.calculateViscosity(composition, 1000);
    
    const hasBoronWarning = result.validation.warnings.some(w => 
      w.includes('boron anomaly') || w.includes('anomaly region')
    );
    expect(hasBoronWarning).toBe(true);
  });
  
  it('should report components in/out of range', () => {
    const composition = {
      SiO2: 72.2, Na2O: 13.4, CaO: 11.2, MgO: 1.5, Al2O3: 1.3, K2O: 0.4
    };
    
    const result = service.calculateViscosity(composition, 1000);
    
    expect(result.validation.componentsInRange).toBeGreaterThan(0);
    expect(result.validation.componentsOutOfRange).toBe(0);
  });
});
```

---

## Integration Tests

### Test Suite: End-to-End Workflow

```typescript
describe('GlassViscosityService - Integration', () => {
  let service: GlassViscosityService;
  
  beforeEach(() => {
    service = new GlassViscosityService();
  });
  
  it('should complete full workflow from composition to fixed points', () => {
    const composition = {
      SiO2: 72.2, Na2O: 13.4, CaO: 11.2, MgO: 1.5, Al2O3: 1.3, K2O: 0.4
    };
    
    const result = service.calculateViscosity(composition, 1100);
    
    // System detected
    expect(result.model.systemType).toBeDefined();
    
    // Viscosity calculated
    expect(result.viscosity_Pas).toBeGreaterThan(0);
    expect(result.logViscosity).toBeGreaterThan(-2);
    
    // Fixed points present
    expect(result.fixedPoints.softeningPoint_C).toBeGreaterThan(0);
    
    // Validation status
    expect(result.validation.confidenceLevel).toBeDefined();
    
    // Component breakdown
    expect(result.components.networkFormers.length).toBeGreaterThan(0);
    expect(result.components.networkModifiers.length).toBeGreaterThan(0);
  });
  
  it('should handle multiple temperature calculations consistently', () => {
    const composition = {
      SiO2: 72.2, Na2O: 13.4, CaO: 11.2, MgO: 1.5, Al2O3: 1.3, K2O: 0.4
    };
    
    const result1 = service.calculateViscosity(composition, 1000);
    const result2 = service.calculateViscosity(composition, 1100);
    const result3 = service.calculateViscosity(composition, 1200);
    
    // Same model for all temperatures
    expect(result1.model.systemType).toBe(result2.model.systemType);
    expect(result2.model.systemType).toBe(result3.model.systemType);
    
    // Viscosity decreases with temperature
    expect(result1.viscosity_Pas).toBeGreaterThan(result2.viscosity_Pas);
    expect(result2.viscosity_Pas).toBeGreaterThan(result3.viscosity_Pas);
    
    // Fixed points same for all
    expect(result1.fixedPoints.softeningPoint_C).toBeCloseTo(
      result2.fixedPoints.softeningPoint_C, 1
    );
  });
});
```

---

## Numerical Methods Tests

### newton-raphson.util.spec.ts

```typescript
import { newtonRaphson } from '../../../../src/common/utils/numerical-methods.util';

describe('newtonRaphson', () => {
  it('should find root of quadratic equation', () => {
    const result = newtonRaphson(
      (x) => x*x - 4,
      (x) => 2*x,
      { initialGuess: 1, minValue: 0 }
    );
    
    expect(result.converged).toBe(true);
    expect(result.root).toBeCloseTo(2.0, 6);
    expect(Math.abs(result.functionValue)).toBeLessThan(1e-10);
  });
  
  it('should work without providing derivative', () => {
    const result = newtonRaphson(
      (x) => Math.exp(x) - 10,
      undefined,
      { initialGuess: 2 }
    );
    
    expect(result.converged).toBe(true);
    expect(result.root).toBeCloseTo(Math.log(10), 5);
  });
  
  it('should respect min/max bounds', () => {
    const result = newtonRaphson(
      (x) => x*x - 4,
      (x) => 2*x,
      { initialGuess: 1, minValue: 0, maxValue: 10 }
    );
    
    expect(result.root).toBeGreaterThanOrEqual(0);
    expect(result.root).toBeLessThanOrEqual(10);
  });
  
  it('should throw if initial guess outside bounds', () => {
    expect(() => {
      newtonRaphson(
        (x) => x*x - 4,
        (x) => 2*x,
        { initialGuess: 100, minValue: 0, maxValue: 10 }
      );
    }).toThrow('outside allowed range');
  });
});
```

---

## Test Coverage Requirements

### Minimum Coverage

| Category | Target | Critical |
|----------|--------|----------|
| Statements | 90% | 95% |
| Branches | 85% | 90% |
| Functions | 95% | 100% |
| Lines | 90% | 95% |

### Public Methods Coverage

**All public methods MUST have tests:**
- ✅ `calculateViscosity()`
- ✅ `normalizeComposition()` (if public)
- ✅ `detectViscosityModel()` (if public)
- ✅ Any other exported functions

---

## Performance Tests

```typescript
describe('GlassViscosityService - Performance', () => {
  it('should calculate viscosity in < 10ms', () => {
    const service = new GlassViscosityService();
    const composition = {
      SiO2: 72.2, Na2O: 13.4, CaO: 11.2, MgO: 1.5, Al2O3: 1.3, K2O: 0.4
    };
    
    const start = Date.now();
    service.calculateViscosity(composition, 1100);
    const duration = Date.now() - start;
    
    expect(duration).toBeLessThan(10);
  });
  
  it('should handle 1000 calculations in < 5s', () => {
    const service = new GlassViscosityService();
    const composition = {
      SiO2: 72.2, Na2O: 13.4, CaO: 11.2, MgO: 1.5, Al2O3: 1.3, K2O: 0.4
    };
    
    const start = Date.now();
    for (let i = 0; i < 1000; i++) {
      service.calculateViscosity(composition, 1000 + i);
    }
    const duration = Date.now() - start;
    
    expect(duration).toBeLessThan(5000);
  });
});
```

---

**Next:** [Chapter 17 - Literature References](./chapter-17-references.md)

