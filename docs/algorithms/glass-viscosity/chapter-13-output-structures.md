# Chapter 13: Output Structures

**Part III: Implementation**

---

## Overview

This chapter defines the **complete output structure** for the glass viscosity service, including:
- Viscosity calculation results
- Fixed points
- Model information
- Validation status
- Component breakdown

---

## Main Interface: ViscosityResult

```typescript
/**
 * Complete viscosity calculation result
 */
export interface ViscosityResult {
  /** Calculated viscosity at given temperature */
  viscosity_Pas: number;
  
  /** Input temperature */
  temperature_C: number;
  
  /** Log10 of viscosity for easier comparison */
  logViscosity: number;
  
  /** Model information and parameters */
  model: ModelInfo;
  
  /** ASTM C965-96 fixed points */
  fixedPoints: FixedPoints;
  
  /** Composition validation and warnings */
  validation: ValidationStatus;
  
  /** Component breakdown and effects */
  components: ComponentBreakdown;
  
  /** Optional empirical estimates for comparison */
  empiricalEstimates?: EmpiricalEstimates;
  
  /** Optional verification data (for development/testing) */
  verification?: VerificationData;
}
```

---

## Model Information

```typescript
/**
 * Information about the model used for calculation
 */
export interface ModelInfo {
  /** Equation type used */
  type: 'VFT' | 'ARRHENIUS';
  
  /** Glass system detected */
  systemType: ViscosityModel;
  
  /** Human-readable system name */
  systemName: string;
  
  /** VFT/Arrhenius parameters */
  parameters: ModelParameters;
}

/**
 * Model parameters (VFT or Arrhenius)
 */
export interface ModelParameters {
  /** Pre-exponential constant */
  A: number;
  
  /** Activation energy parameter (K) */
  B: number;
  
  /** VFT temperature (K), only for VFT model */
  T0?: number;
  
  /** Valid temperature range for this model */
  temperatureRange: {
    min_C: number;
    max_C: number;
  };
}

/**
 * Enum for glass system types
 */
export enum ViscosityModel {
  SODA_LIME_SILICA = 'SODA_LIME_SILICA',
  BOROSILICATE = 'BOROSILICATE',
  ALUMINOSILICATE = 'ALUMINOSILICATE',
  LEAD_GLASS = 'LEAD_GLASS',
  PURE_SILICA = 'PURE_SILICA',
  SODIUM_SILICATE = 'SODIUM_SILICATE',
  SLAG_CAO_AL2O3 = 'SLAG_CAO_AL2O3',
  FLUORIDE_GLASS = 'FLUORIDE_GLASS',
  MULTI_COMPONENT_MIXING = 'MULTI_COMPONENT_MIXING',
}
```

---

## Fixed Points

```typescript
/**
 * ASTM C965-96 fixed points
 */
export interface FixedPoints {
  /** Melting point: η = 1 Pa·s */
  meltingPoint_C: number;
  
  /** Flow point: η = 10^4 Pa·s */
  flowPoint_C: number;
  
  /** Working point: η = 10^3 Pa·s */
  workingPoint_C: number;
  
  /** Softening point: η = 10^6.6 Pa·s (ASTM C338) */
  softeningPoint_C: number;
  
  /** Annealing point: η = 10^12 Pa·s (ASTM C336) */
  annealingPoint_C: number;
  
  /** Strain point: η = 10^13.5 Pa·s (ASTM C336) */
  strainPoint_C: number;
  
  /** Temperature spans between key points */
  spans?: FixedPointSpans;
}

/**
 * Temperature spans between fixed points
 */
export interface FixedPointSpans {
  /** Melting to strain point */
  meltingToStrain_C: number;
  
  /** Working to softening */
  workingToSoftening_C: number;
  
  /** Softening to annealing */
  softeningToAnnealing_C: number;
  
  /** Annealing to strain */
  annealingToStrain_C: number;
}
```

---

## Validation Status

```typescript
/**
 * Composition validation status
 */
export interface ValidationStatus {
  /** Detected system description */
  systemDetected: string;
  
  /** Overall confidence level */
  confidenceLevel: ConfidenceLevel;
  
  /** Warnings about composition */
  warnings: string[];
  
  /** Number of components within validated ranges */
  componentsInRange: number;
  
  /** Number of components outside validated ranges */
  componentsOutOfRange: number;
  
  /** Risk level for extrapolation */
  extrapolationRisk: ExtrapolationRisk;
  
  /** Specific composition issues */
  compositionIssues?: CompositionIssue[];
}

/**
 * Confidence levels
 */
export enum ConfidenceLevel {
  HIGH = 'HIGH',           // Within validated ranges, established system
  MEDIUM = 'MEDIUM',       // Minor deviations or near boundaries
  LOW = 'LOW',             // Significant deviations or specialty system
  VERY_LOW = 'VERY_LOW',   // Multi-component mixing, major extrapolation
}

/**
 * Extrapolation risk levels
 */
export enum ExtrapolationRisk {
  NONE = 'NONE',           // All components well within ranges
  MINOR = 'MINOR',         // Small deviations (5-10%)
  MODERATE = 'MODERATE',   // Several components outside or anomaly region
  SEVERE = 'SEVERE',       // No matching system, extreme compositions
}

/**
 * Specific composition issue
 */
export interface CompositionIssue {
  /** Component name */
  component: string;
  
  /** Actual value */
  value: number;
  
  /** Valid range */
  validRange: {
    min: number;
    max: number;
  };
  
  /** Severity */
  severity: 'WARNING' | 'ERROR';
  
  /** Description */
  message: string;
}
```

---

## Component Breakdown

```typescript
/**
 * Component breakdown by role
 */
export interface ComponentBreakdown {
  /** Network forming components */
  networkFormers: ComponentEffect[];
  
  /** Network modifying components */
  networkModifiers: ComponentEffect[];
  
  /** Intermediate components */
  intermediates?: ComponentEffect[];
  
  /** Fluoride components (if present) */
  fluorides?: ComponentEffect[];
  
  /** Chloride components (if present) */
  chlorides?: ComponentEffect[];
  
  /** Summary totals */
  totals: ComponentTotals;
}

/**
 * Individual component effect
 */
export interface ComponentEffect {
  /** Component name (e.g., "SiO2") */
  component: string;
  
  /** Percentage in composition */
  percentage: number;
  
  /** Effect on B parameter (K) */
  effectOnB: number;
  
  /** Valid range for this component in this system */
  validRange: string;  // e.g., "65-80%"
  
  /** Whether this component is within valid range */
  inRange: boolean;
  
  /** Role description */
  role: string;  // e.g., "Primary network former"
}

/**
 * Component totals
 */
export interface ComponentTotals {
  /** Total network formers */
  totalFormers: number;
  
  /** Total network modifiers */
  totalModifiers: number;
  
  /** Total alkali (Na2O + K2O + Li2O) */
  totalAlkali: number;
  
  /** Total alkaline earth (CaO + MgO + BaO + SrO) */
  totalAlkalineEarth: number;
  
  /** Total halides (fluorides + chlorides) */
  totalHalides: number;
  
  /** Composition sum (should be ~100%) */
  compositionSum: number;
}
```

---

## Empirical Estimates

```typescript
/**
 * Empirical estimates for comparison
 */
export interface EmpiricalEstimates {
  /** Empirical softening point estimate */
  softeningPoint_C: number;
  
  /** Method used for estimation */
  method: string;
  
  /** Difference from analytical calculation */
  differenceFromAnalytical_C: number;
}
```

---

## Verification Data

```typescript
/**
 * Verification data (optional, for development/testing)
 */
export interface VerificationData {
  /** Round-trip verification */
  roundTrip?: RoundTripVerification;
  
  /** Analytical vs numerical comparison */
  methodComparison?: MethodComparison;
  
  /** Model fit quality metrics */
  fitQuality?: FitQualityMetrics;
}

/**
 * Round-trip verification
 */
export interface RoundTripVerification {
  /** Original temperature */
  originalTemperature_C: number;
  
  /** Calculated viscosity */
  calculatedViscosity_Pas: number;
  
  /** Back-calculated temperature */
  backCalculatedTemperature_C: number;
  
  /** Error (should be near zero) */
  error_C: number;
  
  /** Passed verification */
  passed: boolean;
}

/**
 * Method comparison
 */
export interface MethodComparison {
  /** Analytical solution result */
  analytical: number;
  
  /** Numerical (Newton-Raphson) result */
  numerical: number;
  
  /** Difference */
  difference: number;
  
  /** Methods agree */
  agree: boolean;
}

/**
 * Fit quality metrics
 */
export interface FitQualityMetrics {
  /** R-squared value */
  rSquared: number;
  
  /** RMSE (root mean square error) */
  rmse: number;
  
  /** Data source */
  dataSource: string;
}
```

---

## Example Output

### Example 1: Soda-Lime Glass (High Confidence)

```json
{
  "viscosity_Pas": 2000,
  "temperature_C": 1100,
  "logViscosity": 3.30,
  "model": {
    "type": "VFT",
    "systemType": "SODA_LIME_SILICA",
    "systemName": "Soda-Lime-Silica Glass (Lakatos 1972)",
    "parameters": {
      "A": -3.2,
      "B": 13250,
      "T0": 320,
      "temperatureRange": {
        "min_C": 500,
        "max_C": 1400
      }
    }
  },
  "fixedPoints": {
    "meltingPoint_C": 1385,
    "flowPoint_C": 1152,
    "workingPoint_C": 1098,
    "softeningPoint_C": 730,
    "annealingPoint_C": 546,
    "strainPoint_C": 514,
    "spans": {
      "meltingToStrain_C": 871,
      "workingToSoftening_C": 368,
      "softeningToAnnealing_C": 184,
      "annealingToStrain_C": 32
    }
  },
  "validation": {
    "systemDetected": "Soda-Lime-Silica Glass (Lakatos 1972 model)",
    "confidenceLevel": "HIGH",
    "warnings": [],
    "componentsInRange": 6,
    "componentsOutOfRange": 0,
    "extrapolationRisk": "NONE",
    "compositionIssues": []
  },
  "components": {
    "networkFormers": [
      {
        "component": "SiO2",
        "percentage": 72.2,
        "effectOnB": 3249,
        "validRange": "65-80%",
        "inRange": true,
        "role": "Primary network former"
      },
      {
        "component": "Al2O3",
        "percentage": 1.3,
        "effectOnB": 143,
        "validRange": "0-5%",
        "inRange": true,
        "role": "Network strengthener"
      },
      {
        "component": "MgO",
        "percentage": 1.5,
        "effectOnB": 52,
        "validRange": "0-6%",
        "inRange": true,
        "role": "Network former (in SLS)"
      }
    ],
    "networkModifiers": [
      {
        "component": "Na2O",
        "percentage": 13.4,
        "effectOnB": -1072,
        "validRange": "10-18%",
        "inRange": true,
        "role": "Primary flux"
      },
      {
        "component": "CaO",
        "percentage": 11.2,
        "effectOnB": -616,
        "validRange": "5-15%",
        "inRange": true,
        "role": "Stabilizer/modifier"
      },
      {
        "component": "K2O",
        "percentage": 0.4,
        "effectOnB": -28,
        "validRange": "0-5%",
        "inRange": true,
        "role": "Secondary flux"
      }
    ],
    "totals": {
      "totalFormers": 75.0,
      "totalModifiers": 25.0,
      "totalAlkali": 13.8,
      "totalAlkalineEarth": 12.7,
      "totalHalides": 0.0,
      "compositionSum": 100.0
    }
  },
  "empiricalEstimates": {
    "softeningPoint_C": 718,
    "method": "Enhanced empirical formula (33 components)",
    "differenceFromAnalytical_C": -12
  }
}
```

### Example 2: Borosilicate in Anomaly Region (Medium Confidence)

```json
{
  "viscosity_Pas": 2818,
  "temperature_C": 1200,
  "logViscosity": 3.45,
  "model": {
    "type": "VFT",
    "systemType": "BOROSILICATE",
    "systemName": "Borosilicate Glass (Dingwell 1992)",
    "parameters": {
      "A": -3.8,
      "B": 16200,
      "T0": 245,
      "temperatureRange": {
        "min_C": 400,
        "max_C": 1400
      }
    }
  },
  "fixedPoints": {
    "meltingPoint_C": 1510,
    "flowPoint_C": 1252,
    "workingPoint_C": 1180,
    "softeningPoint_C": 821,
    "annealingPoint_C": 560,
    "strainPoint_C": 510
  },
  "validation": {
    "systemDetected": "Borosilicate Glass (Dingwell 1992 model)",
    "confidenceLevel": "MEDIUM",
    "warnings": [
      "Composition in boron anomaly region (R=0.35). Model accuracy reduced to ±0.2 log units."
    ],
    "componentsInRange": 5,
    "componentsOutOfRange": 0,
    "extrapolationRisk": "MINOR",
    "compositionIssues": [
      {
        "component": "B2O3/Alkali ratio",
        "value": 0.35,
        "validRange": { "min": 0.0, "max": 0.3 },
        "severity": "WARNING",
        "message": "In boron anomaly region. Coordination change affects viscosity."
      }
    ]
  },
  "components": {
    "networkFormers": [
      {
        "component": "SiO2",
        "percentage": 80.6,
        "effectOnB": 4030,
        "validRange": "70-85%",
        "inRange": true,
        "role": "Primary network former"
      },
      {
        "component": "B2O3",
        "percentage": 12.9,
        "effectOnB": -323,
        "validRange": "8-15%",
        "inRange": true,
        "role": "Network former (anomalous)"
      },
      {
        "component": "Al2O3",
        "percentage": 2.3,
        "effectOnB": 230,
        "validRange": "0-5%",
        "inRange": true,
        "role": "Network strengthener"
      }
    ],
    "networkModifiers": [
      {
        "component": "Na2O",
        "percentage": 3.9,
        "effectOnB": -332,
        "validRange": "2-8%",
        "inRange": true,
        "role": "Primary flux"
      },
      {
        "component": "K2O",
        "percentage": 0.3,
        "effectOnB": -23,
        "validRange": "0-3%",
        "inRange": true,
        "role": "Secondary flux"
      }
    ],
    "totals": {
      "totalFormers": 95.8,
      "totalModifiers": 4.2,
      "totalAlkali": 4.2,
      "totalAlkalineEarth": 0.0,
      "totalHalides": 0.0,
      "compositionSum": 100.0
    }
  }
}
```

---

## TypeScript Type Guards

```typescript
/**
 * Type guard to check if result is valid
 */
export function isValidViscosityResult(result: any): result is ViscosityResult {
  return (
    typeof result === 'object' &&
    typeof result.viscosity_Pas === 'number' &&
    typeof result.temperature_C === 'number' &&
    result.model !== undefined &&
    result.fixedPoints !== undefined &&
    result.validation !== undefined
  );
}

/**
 * Type guard to check confidence level
 */
export function isHighConfidence(result: ViscosityResult): boolean {
  return result.validation.confidenceLevel === ConfidenceLevel.HIGH;
}

/**
 * Type guard to check if in validated range
 */
export function isInValidatedRange(result: ViscosityResult): boolean {
  return (
    result.validation.extrapolationRisk === ExtrapolationRisk.NONE ||
    result.validation.extrapolationRisk === ExtrapolationRisk.MINOR
  );
}
```

---

## Error Handling

```typescript
/**
 * Custom error for viscosity calculation failures
 */
export class ViscosityCalculationError extends Error {
  constructor(
    message: string,
    public readonly code: ViscosityErrorCode,
    public readonly details?: any
  ) {
    super(message);
    this.name = 'ViscosityCalculationError';
  }
}

/**
 * Error codes
 */
export enum ViscosityErrorCode {
  INVALID_COMPOSITION = 'INVALID_COMPOSITION',
  COMPOSITION_SUM_ERROR = 'COMPOSITION_SUM_ERROR',
  TEMPERATURE_OUT_OF_RANGE = 'TEMPERATURE_OUT_OF_RANGE',
  NO_MATCHING_SYSTEM = 'NO_MATCHING_SYSTEM',
  CALCULATION_FAILED = 'CALCULATION_FAILED',
  NEWTON_RAPHSON_NO_CONVERGENCE = 'NEWTON_RAPHSON_NO_CONVERGENCE',
}
```

---

**Next:** [Chapter 14 - Validation Dataset](./chapter-14-validation-dataset.md)

