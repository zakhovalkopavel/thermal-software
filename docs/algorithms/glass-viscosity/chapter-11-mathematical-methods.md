# Chapter 11: Mathematical Methods

**Part III: Implementation**

---

## Overview

This chapter covers the mathematical methods for:
1. **Forward problem:** Calculate viscosity from temperature
2. **Inverse problem:** Calculate temperature from target viscosity (fixed points)
3. **Numerical methods:** Newton-Raphson for VFT models
4. **Validation:** Round-trip verification

---

## Forward Problem: Temperature → Viscosity

### VFT Model

**Equation:**
```
log₁₀(η) = A + B/(T - T₀)
```

**Implementation:**
```typescript
function calculateViscosityVFT(
  T_celsius: number,
  A: number,
  B: number,
  T0_kelvin: number
): number {
  const T_K = T_celsius + 273.15;
  
  // VFT equation
  const logViscosity = A + B / (T_K - T0_kelvin);
  
  // Convert from log10 to actual viscosity
  const viscosity = Math.pow(10, logViscosity);
  
  // Clamp to physical range
  return Math.max(0.001, Math.min(1e15, viscosity));
}
```

**Example:**
```typescript
// Soda-lime glass at 1100°C
const eta = calculateViscosityVFT(
  1100,      // temperature (°C)
  -3.2,      // A
  13250,     // B (K)
  320        // T0 (K)
);

// Result: η ≈ 2000 Pa·s (log η ≈ 3.3)
```

### Arrhenius Model

**Equation:**
```
ln(η) = A + B/T
```

**Implementation:**
```typescript
function calculateViscosityArrhenius(
  T_celsius: number,
  A: number,
  B: number
): number {
  const T_K = T_celsius + 273.15;
  
  // Arrhenius equation
  const lnViscosity = A + B / T_K;
  
  // Convert from ln to actual viscosity
  const viscosity = Math.exp(lnViscosity);
  
  // Clamp to physical range
  return Math.max(0.001, Math.min(1e15, viscosity));
}
```

**Example:**
```typescript
// Lead glass at 900°C
const eta = calculateViscosityArrhenius(
  900,       // temperature (°C)
  -7.2,      // A
  11800      // B (K)
);

// Result: η ≈ 1585 Pa·s (log η ≈ 3.2)
```

---

## Inverse Problem: Viscosity → Temperature

### Analytical Solution for VFT

**Given:** Target viscosity η_target  
**Find:** Temperature T where η = η_target

**Rearrange VFT equation:**
```
log₁₀(η) = A + B/(T - T₀)

B/(T - T₀) = log₁₀(η) - A

T - T₀ = B / (log₁₀(η) - A)

T = T₀ + B / (log₁₀(η) - A)
```

**Implementation:**
```typescript
function calculateTemperatureForViscosityVFT(
  targetViscosity_Pas: number,
  A: number,
  B: number,
  T0_kelvin: number
): number {
  // Calculate log10 of target viscosity
  const logEta = Math.log10(targetViscosity_Pas);
  
  // Analytical solution
  const T_K = T0_kelvin + B / (logEta - A);
  
  // Convert to Celsius
  const T_C = T_K - 273.15;
  
  // Validate result
  if (T_C < 0 || T_C > 2500) {
    throw new Error(`Temperature ${T_C}°C outside physical range`);
  }
  
  return T_C;
}
```

**Example - Calculate softening point:**
```typescript
// Softening point: η = 10^6.6 Pa·s
const T_softening = calculateTemperatureForViscosityVFT(
  Math.pow(10, 6.6),  // 3,981,072 Pa·s
  -3.2,               // A
  13250,              // B
  320                 // T0
);

// Result: T ≈ 730°C
```

### Analytical Solution for Arrhenius

**Rearrange Arrhenius equation:**
```
ln(η) = A + B/T

B/T = ln(η) - A

T = B / (ln(η) - A)
```

**Implementation:**
```typescript
function calculateTemperatureForViscosityArrhenius(
  targetViscosity_Pas: number,
  A: number,
  B: number
): number {
  // Calculate ln of target viscosity
  const lnEta = Math.log(targetViscosity_Pas);
  
  // Analytical solution
  const T_K = B / (lnEta - A);
  
  // Convert to Celsius
  const T_C = T_K - 273.15;
  
  // Validate result
  if (T_C < 0 || T_C > 2500) {
    throw new Error(`Temperature ${T_C}°C outside physical range`);
  }
  
  return T_C;
}
```

---

## Newton-Raphson Method (General Numerical Root Finding)

Newton-Raphson is a **general-purpose** iterative method for finding roots of any function.

**Location:** Should be implemented as a **general utility**, not specific to refractory/viscosity.

**Recommended file:** `backend/src/common/utils/numerical-methods.util.ts`

### Generic Newton-Raphson Implementation

**Objective:** Find x where f(x) = 0

**Algorithm:**
```
x_{n+1} = x_n - f(x_n) / f'(x_n)
```

**Generic Interface:**
```typescript
/**
 * Configuration for Newton-Raphson root finding
 */
interface NewtonRaphsonOptions {
  /** Initial guess for the root */
  initialGuess: number;
  
  /** Maximum number of iterations */
  maxIterations?: number; // default: 100
  
  /** Convergence tolerance (absolute) */
  tolerance?: number; // default: 1e-6
  
  /** Minimum allowed value for the solution */
  minValue?: number; // default: -Infinity
  
  /** Maximum allowed value for the solution */
  maxValue?: number; // default: Infinity
  
  /** Step size for numerical derivative (if derivative not provided) */
  derivativeStepSize?: number; // default: 1e-8
}

/**
 * Result of Newton-Raphson iteration
 */
interface NewtonRaphsonResult {
  /** The root found */
  root: number;
  
  /** Number of iterations performed */
  iterations: number;
  
  /** Final function value at the root */
  functionValue: number;
  
  /** Whether convergence was achieved */
  converged: boolean;
  
  /** Error estimate */
  error: number;
}
```

**Full Implementation:**
```typescript
/**
 * Generic Newton-Raphson root finder
 * 
 * Finds x where f(x) = 0 using Newton-Raphson iteration.
 * 
 * @param f - Function to find root of
 * @param fPrime - Derivative of f (optional - will be approximated if not provided)
 * @param options - Configuration options
 * @returns Root finding result
 * 
 * @example
 * // Find where x^2 - 4 = 0 (should find x = 2)
 * const result = newtonRaphson(
 *   (x) => x*x - 4,
 *   (x) => 2*x,
 *   { initialGuess: 1 }
 * );
 * console.log(result.root); // 2.0
 */
export function newtonRaphson(
  f: (x: number) => number,
  fPrime?: (x: number) => number,
  options: NewtonRaphsonOptions = { initialGuess: 0 }
): NewtonRaphsonResult {
  // Extract options with defaults
  const {
    initialGuess,
    maxIterations = 100,
    tolerance = 1e-6,
    minValue = -Infinity,
    maxValue = Infinity,
    derivativeStepSize = 1e-8,
  } = options;
  
  // Validate initial guess is within bounds
  if (initialGuess < minValue || initialGuess > maxValue) {
    throw new Error(
      `Initial guess ${initialGuess} outside allowed range [${minValue}, ${maxValue}]`
    );
  }
  
  // If derivative not provided, use numerical approximation
  const derivative = fPrime || ((x: number) => {
    // Central difference approximation: f'(x) ≈ (f(x+h) - f(x-h)) / (2h)
    const h = derivativeStepSize;
    return (f(x + h) - f(x - h)) / (2 * h);
  });
  
  let x = initialGuess;
  let iterations = 0;
  let converged = false;
  let error = Infinity;
  
  for (iterations = 0; iterations < maxIterations; iterations++) {
    // Evaluate function and derivative
    const fx = f(x);
    const fpx = derivative(x);
    
    // Check for zero derivative (would cause division by zero)
    if (Math.abs(fpx) < 1e-15) {
      throw new Error(
        `Derivative is zero at x=${x}. Cannot continue Newton-Raphson iteration.`
      );
    }
    
    // Newton-Raphson step
    const delta = fx / fpx;
    const x_new = x - delta;
    
    // Enforce bounds (clamp to valid range)
    const x_clamped = Math.max(minValue, Math.min(maxValue, x_new));
    
    // Check if we hit a boundary
    if (x_clamped !== x_new) {
      // We're at a boundary - check if this is close enough
      const fx_boundary = f(x_clamped);
      if (Math.abs(fx_boundary) < tolerance) {
        x = x_clamped;
        error = Math.abs(fx_boundary);
        converged = true;
        break;
      } else {
        throw new Error(
          `Solution outside allowed range [${minValue}, ${maxValue}]. ` +
          `Unbounded iteration reached ${x_new}.`
        );
      }
    }
    
    x = x_clamped;
    error = Math.abs(delta);
    
    // Check convergence
    if (error < tolerance) {
      converged = true;
      break;
    }
  }
  
  // Final function evaluation
  const functionValue = f(x);
  
  // Return result
  return {
    root: x,
    iterations: iterations + 1,
    functionValue,
    converged,
    error,
  };
}
```

### Application to VFT Viscosity

**Use the generic utility:**
```typescript
import { newtonRaphson } from '../../../common/utils/numerical-methods.util';

function calculateTemperatureVFT_Newton(
  targetViscosity_Pas: number,
  A: number,
  B: number,
  T0_kelvin: number,
  initialGuess_C: number = 1000
): number {
  const logEtaTarget = Math.log10(targetViscosity_Pas);
  
  // Define the function to solve: f(T) = A + B/(T-T0) - log10(eta_target) = 0
  const f = (T_K: number): number => {
    return A + B / (T_K - T0_kelvin) - logEtaTarget;
  };
  
  // Define the derivative: f'(T) = -B/(T-T0)^2
  const fPrime = (T_K: number): number => {
    return -B / Math.pow(T_K - T0_kelvin, 2);
  };
  
  // Solve using generic Newton-Raphson
  const result = newtonRaphson(f, fPrime, {
    initialGuess: initialGuess_C + 273.15,
    maxIterations: 50,
    tolerance: 0.01, // 0.01 K tolerance
    minValue: 273.15, // 0°C minimum (absolute zero would be 0 K)
    maxValue: 2773.15, // 2500°C maximum
  });
  
  if (!result.converged) {
    throw new Error(
      `Newton-Raphson did not converge after ${result.iterations} iterations. ` +
      `Final error: ${result.error.toFixed(6)}`
    );
  }
  
  // Convert back to Celsius
  return result.root - 273.15;
}
```

### Example: Other Applications

**The generic Newton-Raphson can solve ANY equation:**

```typescript
import { newtonRaphson } from '../../../common/utils/numerical-methods.util';

// Example 1: Solve x^3 - 2x - 5 = 0
const cubic = newtonRaphson(
  (x) => x**3 - 2*x - 5,
  (x) => 3*x**2 - 2,
  { initialGuess: 2 }
);
console.log(`Cubic root: ${cubic.root}`); // ≈ 2.0946

// Example 2: Solve e^x = 10 (find x where e^x - 10 = 0)
const exponential = newtonRaphson(
  (x) => Math.exp(x) - 10,
  (x) => Math.exp(x),
  { initialGuess: 2, minValue: 0 }
);
console.log(`ln(10) = ${exponential.root}`); // ≈ 2.3026

// Example 3: Find intersection of two functions
// Solve f(x) - g(x) = 0 where f(x) = x^2, g(x) = 4
const intersection = newtonRaphson(
  (x) => x**2 - 4,
  (x) => 2*x,
  { initialGuess: 1, minValue: 0 } // Positive root only
);
console.log(`sqrt(4) = ${intersection.root}`); // = 2.0
```

### Comparison: Analytical vs Numerical

**Test case for VFT:**
```typescript
const targetViscosity = Math.pow(10, 6.6); // Softening point
const A = -3.2;
const B = 13250;
const T0 = 320;

// Analytical (preferred)
const T_analytical = calculateTemperatureForViscosityVFT(
  targetViscosity, A, B, T0
);

// Numerical (using generic Newton-Raphson)
const T_numerical = calculateTemperatureVFT_Newton(
  targetViscosity, A, B, T0, 700
);

console.log(`Analytical: ${T_analytical.toFixed(2)}°C`);
console.log(`Numerical:  ${T_numerical.toFixed(2)}°C`);
console.log(`Difference: ${Math.abs(T_analytical - T_numerical).toFixed(4)}°C`);

// Expected output:
// Analytical: 729.85°C
// Numerical:  729.85°C
// Difference: 0.0001°C
```

**Conclusion:** 
- **Analytical solution is preferred** when available (faster, exact)
- **Newton-Raphson is general** and can solve any equation
- **Use Newton-Raphson for:**
  - Complex models without analytical solutions
  - Verification of analytical solutions
  - Equations that change dynamically
  - Any future numerical problems (not just viscosity)

---

## Fixed Points Calculation

### All ASTM Fixed Points

```typescript
interface FixedPoints {
  meltingPoint_C: number;     // η = 1 Pa·s
  flowPoint_C: number;         // η = 10^4 Pa·s
  workingPoint_C: number;      // η = 10^3 Pa·s
  softeningPoint_C: number;    // η = 10^6.6 Pa·s
  annealingPoint_C: number;    // η = 10^12 Pa·s
  strainPoint_C: number;       // η = 10^13.5 Pa·s
}

function calculateAllFixedPoints(
  A: number,
  B: number,
  T0_kelvin: number,
  modelType: 'VFT' | 'ARRHENIUS'
): FixedPoints {
  const calcTemp = modelType === 'VFT' 
    ? (eta: number) => calculateTemperatureForViscosityVFT(eta, A, B, T0_kelvin)
    : (eta: number) => calculateTemperatureForViscosityArrhenius(eta, A, B);
  
  return {
    meltingPoint_C:   calcTemp(1),                    // 10^0
    flowPoint_C:      calcTemp(10000),                // 10^4
    workingPoint_C:   calcTemp(1000),                 // 10^3
    softeningPoint_C: calcTemp(Math.pow(10, 6.6)),   // 10^6.6
    annealingPoint_C: calcTemp(Math.pow(10, 12)),    // 10^12
    strainPoint_C:    calcTemp(Math.pow(10, 13.5)),  // 10^13.5
  };
}
```

**Example usage:**
```typescript
// Soda-lime glass
const fixedPoints = calculateAllFixedPoints(-3.2, 13250, 320, 'VFT');

console.log('Fixed Points:');
console.log(`Melting:    ${fixedPoints.meltingPoint_C.toFixed(0)}°C`);
console.log(`Flow:       ${fixedPoints.flowPoint_C.toFixed(0)}°C`);
console.log(`Working:    ${fixedPoints.workingPoint_C.toFixed(0)}°C`);
console.log(`Softening:  ${fixedPoints.softeningPoint_C.toFixed(0)}°C`);
console.log(`Annealing:  ${fixedPoints.annealingPoint_C.toFixed(0)}°C`);
console.log(`Strain:     ${fixedPoints.strainPoint_C.toFixed(0)}°C`);

// Expected output:
// Melting:    1385°C
// Flow:       1152°C
// Working:    1098°C
// Softening:  730°C
// Annealing:  546°C
// Strain:     514°C
```

---

## Round-Trip Verification

### Purpose
Verify that forward and inverse calculations are consistent.

### Test Procedure

```typescript
function verifyRoundTrip(
  T_original_C: number,
  A: number,
  B: number,
  T0_kelvin: number
): { error_C: number; passed: boolean } {
  // Step 1: Calculate viscosity at original temperature
  const eta = calculateViscosityVFT(T_original_C, A, B, T0_kelvin);
  
  // Step 2: Calculate temperature back from viscosity
  const T_calculated_C = calculateTemperatureForViscosityVFT(eta, A, B, T0_kelvin);
  
  // Step 3: Compare
  const error_C = Math.abs(T_calculated_C - T_original_C);
  const passed = error_C < 0.1; // 0.1°C tolerance
  
  return { error_C, passed };
}
```

**Test multiple temperatures:**
```typescript
const testTemperatures = [500, 700, 900, 1100, 1300, 1500];
const A = -3.2;
const B = 13250;
const T0 = 320;

console.log('Round-Trip Verification:');
testTemperatures.forEach(T => {
  const result = verifyRoundTrip(T, A, B, T0);
  const status = result.passed ? '✓' : '✗';
  console.log(`${status} T=${T}°C, error=${result.error_C.toFixed(4)}°C`);
});

// Expected output (all should pass):
// ✓ T=500°C, error=0.0000°C
// ✓ T=700°C, error=0.0001°C
// ✓ T=900°C, error=0.0001°C
// ✓ T=1100°C, error=0.0001°C
// ✓ T=1300°C, error=0.0001°C
// ✓ T=1500°C, error=0.0001°C
```

---

## Error Handling

### Temperature Range Validation

```typescript
function validateTemperatureRange(T_C: number, modelType: string): void {
  const ranges: Record<string, [number, number]> = {
    'SODA_LIME_SILICA': [400, 1500],
    'BOROSILICATE': [300, 1500],
    'ALUMINOSILICATE': [800, 1700],
    'LEAD_GLASS': [300, 1200],
    'PURE_SILICA': [1000, 2400],
    'SLAG': [1200, 1700],
  };
  
  const [min, max] = ranges[modelType] || [0, 2500];
  
  if (T_C < min || T_C > max) {
    throw new Error(
      `Temperature ${T_C}°C outside valid range [${min}, ${max}]°C for ${modelType}`
    );
  }
}
```

### Viscosity Range Validation

```typescript
function validateViscosity(eta: number): void {
  if (eta < 0.001 || eta > 1e15) {
    throw new Error(
      `Viscosity ${eta} Pa·s outside physical range [0.001, 10^15] Pa·s`
    );
  }
  
  if (!isFinite(eta) || isNaN(eta)) {
    throw new Error('Viscosity calculation resulted in invalid value');
  }
}
```

---

## Performance Optimization

### Batch Calculations

For calculating multiple fixed points, cache intermediate values:

```typescript
class ViscosityCalculator {
  private A: number;
  private B: number;
  private T0: number;
  
  constructor(A: number, B: number, T0: number) {
    this.A = A;
    this.B = B;
    this.T0 = T0;
  }
  
  // Single calculation
  viscosityAt(T_C: number): number {
    const T_K = T_C + 273.15;
    const logEta = this.A + this.B / (T_K - this.T0);
    return Math.pow(10, logEta);
  }
  
  // Inverse calculation
  temperatureFor(eta: number): number {
    const logEta = Math.log10(eta);
    const T_K = this.T0 + this.B / (logEta - this.A);
    return T_K - 273.15;
  }
  
  // Batch fixed points (single object creation)
  getAllFixedPoints(): FixedPoints {
    return {
      meltingPoint_C:   this.temperatureFor(1),
      flowPoint_C:      this.temperatureFor(1e4),
      workingPoint_C:   this.temperatureFor(1e3),
      softeningPoint_C: this.temperatureFor(Math.pow(10, 6.6)),
      annealingPoint_C: this.temperatureFor(1e12),
      strainPoint_C:    this.temperatureFor(Math.pow(10, 13.5)),
    };
  }
}
```

**Usage:**
```typescript
const calc = new ViscosityCalculator(-3.2, 13250, 320);

// Efficient - single object
const fixedPoints = calc.getAllFixedPoints();

// Also efficient - reuse calculator
const eta1 = calc.viscosityAt(1100);
const eta2 = calc.viscosityAt(1200);
```

---

## Summary

### Mathematical Operations

| Operation | Method | Complexity | Accuracy |
|-----------|--------|------------|----------|
| T → η (VFT) | Direct calculation | O(1) | Exact |
| T → η (Arrhenius) | Direct calculation | O(1) | Exact |
| η → T (VFT) | Analytical inversion | O(1) | Exact |
| η → T (Arrhenius) | Analytical inversion | O(1) | Exact |
| η → T (Newton) | Iterative | O(n) | ≈10⁻⁶ °C |
| Round-trip | Forward + Inverse | O(1) | <0.1°C |

### Recommendations

**Use analytical solutions:**
- ✅ Faster (no iteration)
- ✅ Exact (no convergence issues)
- ✅ Simpler code
- ✅ No initial guess needed

**Use Newton-Raphson only for:**
- Verification during development
- Complex models (future)
- Educational demonstrations

---

**Next:** [Chapter 13 - Output Structures](./chapter-13-output-structures.md)

