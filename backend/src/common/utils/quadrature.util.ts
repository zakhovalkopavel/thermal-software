/**
 * Numerical integration — Clenshaw–Curtis and adaptive quadrature.
 *
 *  • Clenshaw–Curtis
 *    — optimal for oscillating or weakly singular integrands (e.g. integrands
 *      containing cos(μₙ x/R), J₀(pₙ r), products of Bessel functions).
 *    — Uses N+1 Chebyshev points on [a,b] and the DCT-based weight formula.
 *
 *  • adaptiveIntegrate (auto-selector)
 *    — probes the integrand on a coarse mesh and counts sign changes to detect
 *      oscillation. Routes to Clenshaw–Curtis when oscillating, Gauss–Legendre
 *      otherwise.
 *
 * Rule of thumb used by the auto-selector:
 *   oscillating  ≡  more than OSCILLATION_THRESHOLD sign changes in PROBE_POINTS samples
 *
 * References:
 *   Trefethen, L.N. — Spectral Methods in MATLAB, SIAM, 2000, Ch. 12.
 *   Waldvogel, J.  — Fast Construction of the Fejér and Clenshaw-Curtis
 *                    Quadrature Rules, BIT Numerical Mathematics, 2006.
 */

import { gaussLegendre, type GaussNodeCount } from './gauss-legendre.util';

export { gaussLegendre, type GaussNodeCount } from './gauss-legendre.util';

// ─── Clenshaw–Curtis ──────────────────────────────────────────────────────────

/**
 * Compute Clenshaw–Curtis weights for N+1 Chebyshev points on [−1, 1].
 *
 * Uses the explicit trigonometric formula:
 *   w_j = (2/N) * [1 − Σ_{k=1}^{N/2−1} 2/(4k²−1)·cos(2kjπ/N) − cos(Njπ/N)/(N²−1)]
 * with endpoints halved (w_0 = w_N /= 2) for the closed Newton–Cotes form.
 *
 * @param N  Number of subintervals (number of nodes = N+1, N must be even).
 */
function clenshawCurtisWeights(N: number): number[] {
  const w = new Array<number>(N + 1).fill(0);

  for (let j = 0; j <= N; j++) {
    let s = 1;
    for (let k = 1; k <= Math.floor(N / 2) - 1; k++) {
      s -= (2 / (4 * k * k - 1)) * Math.cos((2 * k * j * Math.PI) / N);
    }
    s -= Math.cos((N * j * Math.PI) / N) / (N * N - 1);
    w[j] = (2 * s) / N;
  }

  // Endpoints get half weight (closed rule correction)
  w[0] /= 2;
  w[N] /= 2;

  return w;
}

/**
 * Integrate f on [a, b] using N-point Clenshaw–Curtis quadrature.
 *
 * Chebyshev nodes:  xⱼ = cos(j·π/N),  j = 0…N  (on [−1,1])
 * Mapped to [a,b]:  tⱼ = (b+a)/2 + (b−a)/2 · xⱼ
 *
 * Accurate for smooth AND oscillating integrands; convergence is spectral
 * when f is analytic.
 *
 * @param f  Integrand
 * @param a  Lower bound
 * @param b  Upper bound
 * @param N  Number of subintervals (default 64; must be even)
 */
export function clenshawCurtis(
  f: (x: number) => number,
  a: number,
  b: number,
  N = 64,
): number {
  if (N % 2 !== 0) N += 1; // ensure even
  const w = clenshawCurtisWeights(N);
  const mid  = (a + b) / 2;
  const half = (b - a) / 2;
  let sum = 0;
  for (let j = 0; j <= N; j++) {
    const x = Math.cos((j * Math.PI) / N); // Chebyshev node on [−1,1]
    sum += w[j] * f(mid + half * x);
  }
  return half * sum;
}

// ─── Oscillation detector ─────────────────────────────────────────────────────

const PROBE_POINTS = 20;
/**
 * Sign-change count threshold above which the integrand is considered oscillating.
 * A purely smooth integrand typically has 0–1 sign changes; ≥ 3 suggests oscillation.
 */
const OSCILLATION_THRESHOLD = 3;

/**
 * Returns true if the integrand appears to oscillate on [a, b].
 * Counts zero-crossings on a coarse uniform mesh of PROBE_POINTS points.
 */
function isOscillating(f: (x: number) => number, a: number, b: number): boolean {
  const step = (b - a) / (PROBE_POINTS - 1);
  let signChanges = 0;
  let prev = f(a);
  for (let i = 1; i < PROBE_POINTS; i++) {
    const cur = f(a + i * step);
    if (prev * cur < 0) signChanges++;
    prev = cur;
  }
  return signChanges >= OSCILLATION_THRESHOLD;
}

// ─── Adaptive auto-selector ───────────────────────────────────────────────────

export interface AdaptiveIntegrateOptions {
  /**
   * Override the automatic method selection.
   * - `'gauss'`    — force Gauss–Legendre (best for smooth, non-oscillating)
   * - `'cc'`       — force Clenshaw–Curtis (best for oscillating / Bessel-weighted)
   * - `'auto'`     — detect automatically (default)
   */
  method?: 'gauss' | 'cc' | 'auto';
  /**
   * Number of quadrature nodes.
   * For Gauss–Legendre: must be 8 | 16 | 32 | 64 (default 32).
   * For Clenshaw–Curtis: any even integer (default 64).
   */
  nodes?: number;
}

/**
 * Numerically integrate f on [a, b], automatically choosing between
 * Gauss–Legendre (smooth) and Clenshaw–Curtis (oscillating).
 *
 * Use this function for all numerical integrations in the thermal-distribution
 * module where no closed-form antiderivative is available.
 *
 * @param f     Integrand
 * @param a     Lower bound
 * @param b     Upper bound
 * @param opts  Method override and node count
 */
export function adaptiveIntegrate(
  f: (x: number) => number,
  a: number,
  b: number,
  opts: AdaptiveIntegrateOptions = {},
): number {
  const { method = 'auto', nodes } = opts;

  const useCC =
    method === 'cc' ||
    (method === 'auto' && isOscillating(f, a, b));

  if (useCC) {
    return clenshawCurtis(f, a, b, nodes ?? 64);
  }

  const glNodes = ([8, 16, 20, 32, 64] as const).includes(nodes as GaussNodeCount)
    ? (nodes as GaussNodeCount)
    : 32;
  return gaussLegendre(f, a, b, glNodes);
}
