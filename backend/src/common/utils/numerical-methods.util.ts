/**
 * Numerical Methods Utility
 *
 * General-purpose numerical algorithms for root finding, optimization, integration, etc.
 * These methods are domain-agnostic and can be used by any module.
 *
 * @module common/utils/numerical-methods
 */

// ============================================================
// INTERFACES
// ============================================================

/**
 * Configuration for Newton-Raphson root finding
 */
export interface NewtonRaphsonOptions {
  /** Initial guess for the root */
  initialGuess: number;

  /** Maximum number of iterations (default: 100) */
  maxIterations?: number;

  /** Convergence tolerance - absolute error (default: 1e-6) */
  tolerance?: number;

  /** Minimum allowed value for the solution (default: -Infinity) */
  minValue?: number;

  /** Maximum allowed value for the solution (default: Infinity) */
  maxValue?: number;

  /** Step size for numerical derivative if derivative not provided (default: 1e-8) */
  derivativeStepSize?: number;
}

/**
 * Result of Newton-Raphson iteration
 */
export interface NewtonRaphsonResult {
  /** The root found (solution to f(x) = 0) */
  root: number;

  /** Number of iterations performed */
  iterations: number;

  /** Final function value at the root (should be close to 0) */
  functionValue: number;

  /** Whether convergence was achieved within tolerance */
  converged: boolean;

  /** Final error estimate (absolute change in last iteration) */
  error: number;
}

// ============================================================
// NEWTON-RAPHSON ROOT FINDING
// ============================================================

/**
 * Generic Newton-Raphson root finder
 *
 * Finds x where f(x) = 0 using iterative Newton-Raphson method.
 * Can be used for any continuous differentiable function.
 *
 * **Algorithm:**
 * ```
 * x_{n+1} = x_n - f(x_n) / f'(x_n)
 * ```
 *
 * **Features:**
 * - Optional derivative (will approximate numerically if not provided)
 * - Bounded search (enforces min/max constraints)
 * - Configurable convergence tolerance
 * - Convergence diagnostics
 *
 * @param f - Function to find root of (must be continuous)
 * @param fPrime - Derivative of f (optional - will be approximated if not provided)
 * @param options - Configuration options
 * @returns Root finding result with diagnostics
 *
 * @throws Error if initial guess is outside bounds
 * @throws Error if derivative is zero (unable to proceed)
 * @throws Error if solution is outside allowed range
 *
 * @example
 * // Find where x^2 - 4 = 0 (should find x = 2)
 * const result = newtonRaphson(
 *   (x) => x*x - 4,
 *   (x) => 2*x,
 *   { initialGuess: 1 }
 * );
 * console.log(result.root); // 2.0
 *
 * @example
 * // Find temperature where VFT viscosity = target
 * const result = newtonRaphson(
 *   (T) => A + B/(T - T0) - logViscosityTarget,
 *   (T) => -B / Math.pow(T - T0, 2),
 *   { initialGuess: 1000, minValue: T0 + 1 }
 * );
 */
export function newtonRaphson(
  f: (x: number) => number,
  fPrime?: (x: number) => number,
  options: NewtonRaphsonOptions = { initialGuess: 0 }
): NewtonRaphsonResult {
  // Default options
  const maxIterations = options.maxIterations ?? 100;
  const tolerance = options.tolerance ?? 1e-6;
  const minValue = options.minValue ?? -Infinity;
  const maxValue = options.maxValue ?? Infinity;
  const h = options.derivativeStepSize ?? 1e-8;

  let x = options.initialGuess;

  // Validate initial guess
  if (x < minValue || x > maxValue) {
    throw new Error(`Initial guess ${x} is outside allowed range [${minValue}, ${maxValue}]`);
  }

  // Numerical derivative approximation if not provided
  const derivative = fPrime ?? ((x: number) => {
    return (f(x + h) - f(x - h)) / (2 * h);
  });

  let iteration = 0;
  let error = Infinity;
  let converged = false;

  while (iteration < maxIterations && !converged) {
    const fx = f(x);
    const dfx = derivative(x);

    // Check for zero derivative
    if (Math.abs(dfx) < 1e-15) {
      throw new Error(`Derivative is zero at x = ${x}. Cannot continue Newton-Raphson.`);
    }

    // Newton-Raphson update
    const dx = fx / dfx;
    const xNew = x - dx;

    // Enforce bounds
    let xBounded = xNew;
    if (xNew < minValue) {
      xBounded = minValue + (minValue - xNew) * 0.1;
    } else if (xNew > maxValue) {
      xBounded = maxValue - (xNew - maxValue) * 0.1;
    }

    // Calculate error
    error = Math.abs(xBounded - x);

    // Update x
    x = xBounded;
    iteration++;

    // Check convergence
    if (error < tolerance && Math.abs(fx) < tolerance * 10) {
      converged = true;
    }
  }

  // Final validation
  if (x < minValue || x > maxValue) {
    throw new Error(`Solution ${x} is outside allowed range [${minValue}, ${maxValue}]`);
  }

  return {
    root: x,
    iterations: iteration,
    functionValue: f(x),
    converged,
    error,
  };
}

/**
 * Bisection method for root finding (more robust but slower than Newton-Raphson)
 *
 * Finds x where f(x) = 0 using the bisection method.
 * Requires that f(a) and f(b) have opposite signs.
 *
 * @param f - Function to find root of
 * @param a - Lower bound (f(a) must have opposite sign from f(b))
 * @param b - Upper bound (f(b) must have opposite sign from f(a))
 * @param tolerance - Convergence tolerance (default: 1e-6)
 * @param maxIterations - Maximum iterations (default: 100)
 * @returns Root of the function
 *
 * @throws Error if f(a) and f(b) have the same sign
 *
 * @example
 * // Find where x^2 - 4 = 0 between 0 and 3
 * const root = bisection((x) => x*x - 4, 0, 3);
 * console.log(root); // 2.0
 */
export function bisection(
  f: (x: number) => number,
  a: number,
  b: number,
  tolerance: number = 1e-6,
  maxIterations: number = 100
): number {
  let fa = f(a);
  let fb = f(b);

  // Check that f(a) and f(b) have opposite signs
  if (fa * fb > 0) {
    throw new Error(`f(a) and f(b) must have opposite signs. f(${a}) = ${fa}, f(${b}) = ${fb}`);
  }

  let iteration = 0;
  let c = (a + b) / 2;

  while (iteration < maxIterations && (b - a) > tolerance) {
    c = (a + b) / 2;
    const fc = f(c);

    if (Math.abs(fc) < tolerance) {
      break;
    }

    if (fa * fc < 0) {
      b = c;
      fb = fc;
    } else {
      a = c;
      fa = fc;
    }

    iteration++;
  }

  return c;
}

/**
 * Linear interpolation
 *
 * @param x0 - First x value
 * @param y0 - First y value
 * @param x1 - Second x value
 * @param y1 - Second y value
 * @param x - X value to interpolate at
 * @returns Interpolated y value
 */
export function linearInterpolation(
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  x: number
): number {
  if (x1 === x0) {
    return (y0 + y1) / 2;
  }
  return y0 + (y1 - y0) * (x - x0) / (x1 - x0);
}

