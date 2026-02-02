# Service Test Specification & Checklist

**Date:** February 2, 2026  
**Module:** `backend/src/modules/refractory/services/`  
**Status:** In Progress

---

## Overview

This document lists all public methods in refractory services and tracks test implementation status.

**Goal:** Every public method must have at least one unit test

---

## Service Test Status

### 1. PSDCalculatorService
**File:** `psd-calculator.service.ts`  
**Test File:** `test/unit/refractory/services/psd-calculator.service.spec.ts`

| Public Method | Tests | Status | Notes |
|---------------|-------|--------|-------|
| `andreasenDiscrete(fractions, q)` | ✅ 3+ | ✅ DONE | Binary, single, multi-fraction |
| `funkDingerDiscrete(fractions, q)` | ✅ 3+ | ✅ DONE | Alternative to Andreasen |
| (Others) | ? | ? | Check existing tests |

**Checklist:**
- [ ] All methods have tests
- [ ] Edge cases tested
- [ ] Output validation
- [ ] Parameter bounds

---

### 2. PackingService
**File:** `packing.service.ts`  
**Test File:** `test/unit/refractory/services/packing.service.spec.ts`

| Public Method | Tests | Status | Notes |
|---------------|-------|--------|-------|
| `calculateCPM(inputs, calibration?)` | ✅ 5+ | ✅ DONE | Happy path, edge cases |
| `calculateFurnas(inputs, efficiency?)` | ✅ 2+ | ✅ DONE | Sequential filling model |
| `resolveBeta0(calibration?)` | ❌ | ❌ NEEDED | Model resolution |
| `resolveMaxPhi(calibration?, diameters, fractions)` | ❌ | ❌ NEEDED | Adaptive limit selection |
| `CompositionAnalyzer.analyzeComposition()` | ❌ | ❌ NEEDED | Micro-filler detection, PSD quality |

**Checklist:**
- [ ] calculateCPM
- [ ] calculateFurnas
- [ ] resolveBeta0
- [ ] resolveMaxPhi
- [ ] CompositionAnalyzer
- [ ] Edge cases (dense/loose packing)

**Priority:** HIGH - Core algorithm

---

### 3. ShrinkageService
**File:** `shrinkage.service.ts`  
**Test File:** `test/unit/refractory/services/shrinkage.service.spec.ts`

| Public Method | Tests | Status | Notes |
|---------------|-------|--------|-------|
| `calculateCompleteShrinkage(inputs)` | ✅ ? | ? | Drying + firing |
| `calculateDryingShrinkage(inputs)` | ✅ ? | ? | Water removal |
| `calculateFiringShrinkage(inputs)` | ✅ ? | ? | Sintering |
| (Other methods) | ? | ? | Need review |

**Checklist:**
- [ ] calculateCompleteShrinkage
- [ ] calculateDryingShrinkage
- [ ] calculateFiringShrinkage
- [ ] Temperature ranges
- [ ] Material types

**Priority:** HIGH - Critical for design

---

### 4. BlendOptimizerService
**File:** `blend-optimizer.service.ts`  
**Test File:** `test/unit/refractory/services/blend-optimizer.service.spec.ts`

| Public Method | Tests | Status | Notes |
|---------------|-------|--------|-------|
| `optimize(request)` | ❌ | ❌ NEEDED | Main optimization method |
| (Internal methods) | - | - | Private only |

**Checklist:**
- [ ] optimize() basic flow
- [ ] Multiple combinations
- [ ] All scenario types
- [ ] Output validation

**Priority:** HIGH - Main service

---

### 5. WaterDemandService ⭐ NEW
**File:** `water-demand.service.ts`  
**Test File:** `test/unit/refractory/services/water-demand.service.spec.ts`

| Public Method | Tests | Status | Notes |
|---------------|-------|--------|-------|
| `calculateWaterDemand(φ, workability?)` | ⏳ | ⏳ IN PROGRESS | 8 tests needed |
| `calculateWaterDemandRange(φ)` | ⏳ | ⏳ IN PROGRESS | 6 tests needed |
| `getWorkabilityFactor(workability)` | ❌ | ❌ NEEDED | 3 tests (firm/std/flow) |
| `calculatePorosity(φ)` | ❌ | ❌ NEEDED | 3 tests |
| `validateWaterDemand(percent)` | ❌ | ❌ NEEDED | 4 tests |

**Checklist:**
- [ ] calculateWaterDemand (8 tests)
- [ ] calculateWaterDemandRange (6 tests)
- [ ] getWorkabilityFactor (3 tests)
- [ ] calculatePorosity (3 tests)
- [ ] validateWaterDemand (4 tests)
- [ ] Total: 24 tests

**Priority:** HIGH - New service

---

### 6. ViscosityService
**File:** `viscosity.service.ts`  
**Test File:** `test/unit/refractory/services/viscosity.service.spec.ts`

| Public Method | Tests | Status | Notes |
|---------------|-------|--------|-------|
| ? | ? | ? | Need to review source |

**Checklist:**
- [ ] Review all public methods
- [ ] Create test cases

**Priority:** MEDIUM

---

### 7. GlassViscosityService
**File:** `glass-viscosity.service.ts`  
**Test File:** `test/unit/refractory/services/glass-viscosity.service.spec.ts`

| Public Method | Tests | Status | Notes |
|---------------|-------|--------|-------|
| ? | ? | ? | Need to review source |

**Checklist:**
- [ ] Review all public methods
- [ ] Create test cases

**Priority:** MEDIUM

---

### 8. MineralPhaseService
**File:** `mineral-phase.service.ts`  
**Test File:** `test/unit/refractory/services/mineral-phase.service.spec.ts`

| Public Method | Tests | Status | Notes |
|---------------|-------|--------|-------|
| ? | ? | ? | Need to review source |

**Checklist:**
- [ ] Review all public methods
- [ ] Create test cases

**Priority:** MEDIUM

---

### 9. PhaseEquilibriumService
**File:** `phase-equilibrium.service.ts`  
**Test File:** `test/unit/refractory/services/phase-equilibrium.service.spec.ts`

| Public Method | Tests | Status | Notes |
|---------------|-------|--------|-------|
| ? | ? | ? | Need to review source |

**Checklist:**
- [ ] Review all public methods
- [ ] Create test cases

**Priority:** MEDIUM

---

### 10. ThermalPerformanceService
**File:** `thermal-performance.service.ts`  
**Test File:** `test/unit/refractory/services/thermal-performance.service.spec.ts`

| Public Method | Tests | Status | Notes |
|---------------|-------|--------|-------|
| ? | ? | ? | Need to review source |

**Checklist:**
- [ ] Review all public methods
- [ ] Create test cases

**Priority:** MEDIUM

---

### 11. RefractorynessService
**File:** `refractoriness.service.ts`  
**Test File:** `test/unit/refractory/services/refractoriness.service.spec.ts`

| Public Method | Tests | Status | Notes |
|---------------|-------|--------|-------|
| ? | ? | ? | Need to review source |

**Checklist:**
- [ ] Review all public methods
- [ ] Create test cases

**Priority:** MEDIUM

---

### 12. ParticipationService
**File:** `participation.service.ts`  
**Test File:** `test/unit/refractory/services/participation.service.spec.ts`

| Public Method | Tests | Status | Notes |
|---------------|-------|--------|-------|
| ? | ? | ? | Need to review source |

**Checklist:**
- [ ] Review all public methods
- [ ] Create test cases

**Priority:** MEDIUM

---

## Test Count Summary

| Service | Total Methods | Tested | % Coverage |
|---------|---------------|--------|-----------|
| PSDCalculatorService | ? | ✅ | High |
| PackingService | 5+ | ⚠️ 2/5 | 40% |
| ShrinkageService | ? | ✅ | ? |
| BlendOptimizerService | 1 | ❌ 0/1 | 0% |
| WaterDemandService | 5 | ⏳ 2/5 | 40% |
| ViscosityService | ? | ? | ? |
| GlassViscosityService | ? | ? | ? |
| MineralPhaseService | ? | ? | ? |
| PhaseEquilibriumService | ? | ? | ? |
| ThermalPerformanceService | ? | ? | ? |
| RefractorynessService | ? | ? | ? |
| ParticipationService | ? | ? | ? |

---

## Implementation Priority

### 🔴 HIGH PRIORITY (Must have tests)

1. **WaterDemandService** (5 public methods)
   - [ ] Move tests from blend-optimizer to water-demand.service.spec.ts
   - [ ] Add missing: getWorkabilityFactor, calculatePorosity, validateWaterDemand
   - [ ] Total tests needed: 24

2. **PackingService** (Already has tests, add missing)
   - [ ] Add resolveBeta0 tests
   - [ ] Add resolveMaxPhi tests
   - [ ] Add CompositionAnalyzer tests

3. **BlendOptimizerService** (Main service)
   - [ ] Add optimize() tests
   - [ ] Test all combination scenarios
   - [ ] Validate results

### 🟡 MEDIUM PRIORITY (Review needed)

4. Review each remaining service for public methods
5. Create test files and basic tests

---

## Test File Structure

### Example: WaterDemandService
```
backend/test/unit/refractory/services/water-demand.service.spec.ts
├── describe('WaterDemandService')
│   ├── describe('calculateWaterDemand')
│   │   ├── it('should calculate water demand for standard workability')
│   │   ├── it('should calculate water demand for firm workability')
│   │   ├── it('should calculate water demand for flowable workability')
│   │   ├── it('should use standard as default workability')
│   │   ├── it('should return water demand within 0-100% range')
│   │   ├── it('should return properly formatted number')
│   │   ├── it('should show water demand increases with lower packing')
│   │   └── it('should scale proportionally with workability factors')
│   ├── describe('calculateWaterDemandRange')
│   │   ├── it('should return min, typical, max water demand values')
│   │   ├── it('should have min <= typical <= max')
│   │   ├── it('should calculate correct values')
│   │   ├── it('should match individual calls')
│   │   ├── it('should show range increases')
│   │   └── it('should provide useful range')
│   ├── describe('getWorkabilityFactor') ⭐ NEW
│   │   ├── it('should return 0.38 for firm')
│   │   ├── it('should return 0.42 for standard')
│   │   └── it('should return 0.50 for flowable')
│   ├── describe('calculatePorosity') ⭐ NEW
│   │   ├── it('should calculate porosity from packing fraction')
│   │   ├── it('should format to 1 decimal place')
│   │   └── it('should range 0-100%')
│   ├── describe('validateWaterDemand') ⭐ NEW
│   │   ├── it('should return true for valid water demand')
│   │   ├── it('should return false for negative')
│   │   ├── it('should return false for > 50%')
│   │   └── it('should accept edge values 0 and 50')
│   └── describe('Real-world scenarios')
│       ├── it('should calculate realistic water demand for high-alumina')
│       ├── it('should calculate realistic water demand for magnesia')
│       ├── it('should calculate realistic water demand for ultra-dense')
│       └── it('should show self-flowing needs higher water')
```

---

## Next Steps

### Phase 1: WaterDemandService (This sprint)
1. ✅ Create WaterDemandService with 5 public methods
2. ⏳ Create water-demand.service.spec.ts with 24 tests
   - Move existing 24 tests from blend-optimizer.water-demand.spec.ts
   - Add 8 tests for new methods (getWorkabilityFactor, calculatePorosity, validateWaterDemand)
3. ✅ Remove methods from BlendOptimizerService

### Phase 2: PackingService (Next)
1. Review existing tests (already good)
2. Add tests for: resolveBeta0, resolveMaxPhi, CompositionAnalyzer
3. Target: 100% public method coverage

### Phase 3: BlendOptimizerService (Next)
1. Create blend-optimizer.service.spec.ts
2. Test optimize() with all scenarios
3. Validate output format

### Phase 4: Other Services (Later)
1. Review each service for public methods
2. Create comprehensive tests
3. Achieve 80%+ coverage

---

## Test Execution

```bash
# Run all tests
npm test

# Run specific service tests
npm test -- water-demand.service.spec.ts
npm test -- packing.service.spec.ts
npm test -- shrinkage.service.spec.ts

# Run with coverage
npm test -- --coverage

# Watch mode
npm test -- --watch
```

---

## Definition of Done

For each service:
- ✅ All public methods identified
- ✅ Test file created
- ✅ At least one test per public method
- ✅ Edge cases tested
- ✅ Output validation tested
- ✅ All tests passing
- ✅ Documentation in place

---

**Status:** Checklist created, now implementing Phase 1 (WaterDemandService)

**Next:** Create water-demand.service.spec.ts with 24+ tests

