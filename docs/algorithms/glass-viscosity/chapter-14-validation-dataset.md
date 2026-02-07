# Chapter 14: Validation Dataset

**Part IV: Validation**

---

## Overview

This chapter contains the **original 14 validation compositions** from published literature, used to validate and calibrate the composition-dependent viscosity models.

**Purpose:**
- Benchmark model accuracy
- Calibrate system-specific parameters
- Verify component effect calculations
- Test system detection algorithm

---

## Dataset Coverage

### By Glass System

| System | Compositions | Data Points | Temperature Range | Reference |
|--------|--------------|-------------|-------------------|-----------|
| Soda-Lime-Silica | 3 | 44 | 514-1500°C | Lakatos 1972, Mills 1989 |
| Borosilicate | 1 | 21 | 510-1500°C | NIST SRM 717a |
| Aluminosilicate | 1 | 6 | 985-1600°C | Giordano 2008 |
| Lead Glass | 1 | 7 | 405-1100°C | Mazurin 1983 |
| Pure Silica | 1 | 7 | 1075-2000°C | Urbain 1982 |
| Sodium Silicate | 1 | 7 | 480-1200°C | Bockris 1955 |
| Slags | 3 | 18 | 1300-1600°C | Mills 1993 |
| Specialty | 3 | 18 | 380-1700°C | Various |
| **Total** | **14** | **128** | **380-2000°C** | -- |

---

## Validation Composition 1: Window Glass (Reference Standard)

**Source:** Lakatos et al. (1972), Glass Technology 13(3):88-95

**Composition (wt%):**
```
SiO2:   72.2
Al2O3:   1.3
Na2O:   13.4
K2O:     0.4
CaO:    11.2
MgO:     1.5
Total: 100.0
```

**System Type:** SODA_LIME_SILICA

**Measured Viscosity Data (11 points):**
| T (°C) | Log₁₀ η (Pa·s) | Notes |
|--------|----------------|-------|
| 1400 | 1.20 | Melting |
| 1300 | 1.85 | Homogenization |
| 1200 | 2.55 | Upper working |
| 1100 | 3.30 | Working point |
| 1000 | 4.15 | Lower working |
| 950 | 4.70 | Forming limit |
| 900 | 5.30 | -- |
| 850 | 6.00 | -- |
| 730 | 7.60 | **Softening point** |
| 546 | 13.0 | **Annealing point** |
| 514 | 14.5 | **Strain point** |

**VFT Parameters (Best Fit):**
```
A = -3.2
B = 13,250 K
T₀ = 320 K
R² = 0.9995
```

**Acceptance Criteria:**
- Viscosity prediction: ±0.15 log units (±40%)
- Fixed points: ±50°C
- Must rank as SODA_LIME_SILICA

---

## Validation Composition 2: Borosilicate (NIST Standard)

**Source:** NIST SRM 717a Certificate + Dingwell (1992)

**Composition (wt%):**
```
SiO2:   80.6
B2O3:   12.9
Al2O3:   2.3
Na2O:    3.9
K2O:     0.3
Total: 100.0
```

**System Type:** BOROSILICATE

**Measured Viscosity Data (21 points with uncertainties):**
| T (°C) | Log₁₀ η (Pa·s) | Uncertainty | Notes |
|--------|----------------|-------------|-------|
| 1500 | 1.60 | ±0.05 | Melting |
| 1400 | 2.10 | ±0.05 | -- |
| 1300 | 2.85 | ±0.06 | -- |
| 1200 | 3.45 | ±0.07 | Working |
| 1100 | 4.25 | ±0.10 | -- |
| 1000 | 5.20 | ±0.15 | -- |
| 900 | 6.40 | ±0.18 | -- |
| 821 | 7.60 | ±0.10 | **Softening (certified)** |
| 560 | 13.0 | ±0.15 | **Annealing (certified)** |
| 510 | 14.5 | ±0.20 | **Strain (certified)** |

**VFT Parameters (NIST Certified):**
```
A = -3.8 ± 0.1
B = 16,200 ± 200 K
T₀ = 245 ± 10 K
R² = 0.9998
```

**Acceptance Criteria:**
- Viscosity prediction: ±0.10 log units (±25%) **STRICT**
- Fixed points: ±10°C **CERTIFIED VALUES**
- Must rank as BOROSILICATE

**Note:** This is the **PRIMARY REFERENCE STANDARD** for validation.

---

## Validation Composition 3-14

### Composition 3: E-Glass Fiber
**System:** ALUMINOSILICATE  
**Source:** Shelby (2005)  
**Composition:** 54% SiO2, 14% Al2O3, 17% CaO, 8% B2O3, 4.5% MgO  
**Data points:** 6  
**Softening:** 846°C  

### Composition 4: Lead Crystal (24% PbO)
**System:** LEAD_GLASS  
**Source:** Mazurin & Gankin (1983)  
**Composition:** 59% SiO2, 24% PbO, 12% K2O, 4% Na2O  
**Data points:** 7  
**Softening:** 635°C  

### Composition 5: Pure Fused Silica
**System:** PURE_SILICA  
**Source:** Urbain et al. (1982)  
**Composition:** 99.9% SiO2  
**Data points:** 7  
**Softening:** 1730°C  

### Composition 6: Sodium Disilicate
**System:** SODIUM_SILICATE  
**Source:** Bockris et al. (1955)  
**Composition:** 75% SiO2, 25% Na2O  
**Data points:** 7  
**Softening:** 480°C  

### Composition 7: Aluminosilicate (High-Alumina)
**System:** ALUMINOSILICATE  
**Source:** Giordano et al. (2008)  
**Composition:** 62% SiO2, 20% Al2O3, 10% CaO, 5% MgO  
**Data points:** 6  
**Softening:** 985°C  

### Composition 8: Blast Furnace Slag
**System:** SLAG_CAO_AL2O3  
**Source:** Mills (1993)  
**Composition:** 37.5% SiO2, 40.3% CaO, 11.2% Al2O3, 8.5% MgO  
**Data points:** 6  
**Temperature:** 1300-1550°C  

### Composition 9: Steelmaking Slag
**System:** SLAG_CAO_AL2O3  
**Source:** Mills (1993)  
**Composition:** 30% SiO2, 45% CaO, 15% FeO, 6% MgO  
**Data points:** 6  
**Temperature:** 1350-1600°C  

### Composition 10: Coal Ash Slag
**System:** SLAG_CAO_AL2O3  
**Source:** Vargas et al. (2001)  
**Composition:** 52% SiO2, 28% Al2O3, 10% Fe2O3, 5% CaO  
**Data points:** 6  
**Temperature:** 1250-1500°C  

### Composition 11: LCD Glass (Eagle XG)
**System:** MULTI_COMPONENT_MIXING  
**Source:** Ellison & Cornejo (2010)  
**Composition:** 62% SiO2, 17.5% Al2O3, 10% B2O3, 5% BaO, 3.5% SrO  
**Data points:** 6  
**Softening:** 845°C  

### Composition 12: Bioactive Glass (45S5)
**System:** MULTI_COMPONENT_MIXING  
**Source:** Hench & Clark (1978)  
**Composition:** 45% SiO2, 24.5% Na2O, 24.5% CaO, 6% P2O5  
**Data points:** 6  
**Softening:** 550°C  

### Composition 13: Fluoroaluminate Glass
**System:** FLUORIDE_GLASS  
**Source:** Poulain et al. (1977)  
**Composition:** 30% AlF3, 25% SiO2, 20% CaF2, 15% MgF2, 8% Na2O  
**Data points:** 5  
**Softening:** 380°C  

### Composition 14: Oxyhalide Glass
**System:** FLUORIDE_GLASS  
**Source:** Mackenzie (1964)  
**Composition:** 70% SiO2, 12% NaF, 10% Na2O, 5% NaCl, 3% CaO  
**Data points:** 5  
**Softening:** 520°C  

---

## Validation Test Procedures

### Test 1: System Detection Accuracy

**Objective:** Verify that the system detection algorithm correctly identifies each composition.

**Procedure:**
```typescript
for (const composition of validationDataset) {
  const detectedSystem = detectViscosityModel(composition.composition);
  
  expect(detectedSystem).toBe(composition.expectedSystem);
}
```

**Pass Criteria:** 14/14 compositions correctly classified

---

### Test 2: Viscosity Prediction Accuracy

**Objective:** Verify viscosity calculations are within acceptable error.

**Procedure:**
```typescript
for (const composition of validationDataset) {
  for (const dataPoint of composition.measuredData) {
    const calculated = calculateViscosity(
      composition.composition,
      dataPoint.temperature_C
    );
    
    const error_logUnits = Math.abs(
      Math.log10(calculated.viscosity_Pas) - dataPoint.logViscosity
    );
    
    expect(error_logUnits).toBeLessThan(composition.tolerance_logUnits);
  }
}
```

**Pass Criteria:**
- **NIST SRM 717a:** RMSE < 0.10 log units
- **Soda-lime glass:** RMSE < 0.15 log units
- **Other systems:** RMSE < 0.30 log units

---

### Test 3: Fixed Points Accuracy

**Objective:** Verify fixed point calculations match measured values.

**Procedure:**
```typescript
for (const composition of validationDataset) {
  const result = calculateViscosity(composition.composition, 1000);
  
  const errors = {
    softening: Math.abs(
      result.fixedPoints.softeningPoint_C - 
      composition.measured.softeningPoint_C
    ),
    annealing: Math.abs(
      result.fixedPoints.annealingPoint_C - 
      composition.measured.annealingPoint_C
    ),
    strain: Math.abs(
      result.fixedPoints.strainPoint_C - 
      composition.measured.strainPoint_C
    ),
  };
  
  expect(errors.softening).toBeLessThan(composition.tolerance_fixedPoint_C);
}
```

**Pass Criteria:**
- **NIST SRM 717a:** All fixed points within ±10°C
- **Soda-lime glass:** All fixed points within ±50°C
- **Other systems:** All fixed points within ±75°C

---

### Test 4: Round-Trip Verification

**Objective:** Verify T → η → T returns original temperature.

**Procedure:**
```typescript
const testTemperatures = [700, 900, 1100, 1300];

for (const T_original of testTemperatures) {
  const eta = calculateViscosity(composition, T_original).viscosity_Pas;
  const T_calculated = calculateTemperatureForViscosity(eta, composition);
  
  const error = Math.abs(T_calculated - T_original);
  expect(error).toBeLessThan(0.1); // 0.1°C tolerance
}
```

**Pass Criteria:** All round-trip errors < 0.1°C

---

### Test 5: Relative Ranking

**Objective:** Verify that model correctly ranks glass viscosities.

**Procedure:**
```typescript
// At 1100°C, expected ranking (low to high viscosity):
const expectedOrder = [
  'Bioactive Glass',      // Very low (high Na2O+CaO)
  'Sodium Silicate',      // Low (high Na2O)
  'Lead Crystal',         // Low-medium (PbO flux)
  'Window Glass',         // Medium (standard SLS)
  'Borosilicate',         // Medium-high (high SiO2+B2O3)
  'Aluminosilicate',      // High (high Al2O3)
  'Pure Silica',          // Very high (pure network former)
];

const calculated = validationDataset
  .map(comp => ({
    name: comp.name,
    viscosity: calculateViscosity(comp.composition, 1100).viscosity_Pas
  }))
  .sort((a, b) => a.viscosity - b.viscosity)
  .map(x => x.name);

expect(calculated).toEqual(expectedOrder);
```

**Pass Criteria:** Correct relative ordering for all compositions

---

## Validation Results Template

### Expected Output Format

```typescript
interface ValidationResults {
  totalCompositions: number;
  systemDetectionAccuracy: number;  // 0-1
  viscosityErrors: {
    rmse_logUnits: number;
    mae_logUnits: number;
    maxError_logUnits: number;
    perSystem: Record<ViscosityModel, {
      rmse: number;
      count: number;
    }>;
  };
  fixedPointErrors: {
    softening_mae_C: number;
    annealing_mae_C: number;
    strain_mae_C: number;
  };
  roundTripErrors: {
    max_C: number;
    mean_C: number;
  };
  rankingAccuracy: number;  // 0-1
  passed: boolean;
}
```

### Target Performance

```json
{
  "totalCompositions": 14,
  "systemDetectionAccuracy": 1.0,
  "viscosityErrors": {
    "rmse_logUnits": 0.18,
    "mae_logUnits": 0.14,
    "maxError_logUnits": 0.35,
    "perSystem": {
      "SODA_LIME_SILICA": { "rmse": 0.12, "count": 44 },
      "BOROSILICATE": { "rmse": 0.08, "count": 21 },
      "ALUMINOSILICATE": { "rmse": 0.20, "count": 12 }
    }
  },
  "fixedPointErrors": {
    "softening_mae_C": 42,
    "annealing_mae_C": 38,
    "strain_mae_C": 35
  },
  "roundTripErrors": {
    "max_C": 0.08,
    "mean_C": 0.02
  },
  "rankingAccuracy": 1.0,
  "passed": true
}
```

---

**Next:** [Chapter 16 - Test Requirements](./chapter-16-test-requirements.md)

