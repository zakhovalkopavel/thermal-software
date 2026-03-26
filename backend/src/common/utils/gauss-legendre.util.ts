/**
 * 20-point Gauss–Legendre quadrature.
 *
 * ── Mathematical background ──────────────────────────────────────────────────
 * Gauss–Legendre quadrature approximates a definite integral by evaluating the
 * integrand at n specially chosen nodes xᵢ ∈ (−1, 1) and forming a weighted sum:
 *
 *   ∫₋₁¹ f(x) dx  ≈  Σᵢ wᵢ · f(xᵢ)
 *
 * For an arbitrary interval [a, b] the standard change of variables gives:
 *
 *   ∫ₐᵇ f(x) dx  =  (b−a)/2 · Σᵢ wᵢ · f( (b+a)/2 + (b−a)/2 · xᵢ )
 *
 * The n-point rule integrates polynomials of degree ≤ 2n−1 exactly.
 * With n = 20 it is exact for polynomials of degree ≤ 39.
 *
 * ── Are the nodes and weights universal? ────────────────────────────────────
 * Yes — completely. They are fixed mathematical constants: the roots of the
 * Legendre polynomial P₂₀(x) and the corresponding Christoffel numbers.
 * They do NOT depend on the integrand, the physical domain, or the application.
 * Every standard numerical analysis library (SciPy, GSL, QUADPACK, Mathematica)
 * uses exactly these same 20 values.
 *
 * ── Canonical source ────────────────────────────────────────────────────────
 * Abramowitz, M.; Stegun, I.A. (eds.) —
 *   Handbook of Mathematical Functions with Formulas, Graphs, and Mathematical
 *   Tables. National Bureau of Standards Applied Mathematics Series 55, 1964.
 *   Table 25.4 (Abscissas and Weight Factors for Gaussian Integration), p. 916–919.
 *   URL: https://personal.math.ubc.ca/~cbm/aands/page_916.htm
 *
 * Cross-verified at: https://pomax.github.io/bezierinfo/legendre-gauss.html
 */

/** Gauss–Legendre 20-point nodes on (−1, 1). Source: Abramowitz & Stegun, Table 25.4. */
export const GL20_NODES: readonly number[] = [
  -0.9931285991850949, -0.9639719272779138, -0.9122344282513259, -0.8391169718222188,
  -0.7463062256567499, -0.6360536807265150, -0.5108670019508271, -0.3737060887154195,
  -0.2277858511416451, -0.0765265211334973,
   0.0765265211334973,  0.2277858511416451,  0.3737060887154195,  0.5108670019508271,
   0.6360536807265150,  0.7463062256567499,  0.8391169718222188,  0.9122344282513259,
   0.9639719272779138,  0.9931285991850949,
];

/** Gauss–Legendre 20-point weights. Source: Abramowitz & Stegun, Table 25.4. */
export const GL20_WEIGHTS: readonly number[] = [
  0.0176140071391521, 0.0406014298003869, 0.0626720483341091, 0.0832767415767048,
  0.1019301198172404, 0.1181945319615184, 0.1316886384491766, 0.1420961093183820,
  0.1491729864726037, 0.1527533871307258,
  0.1527533871307258, 0.1491729864726037, 0.1420961093183820, 0.1316886384491766,
  0.1181945319615184, 0.1019301198172404, 0.0832767415767048, 0.0626720483341091,
  0.0406014298003869, 0.0176140071391521,
];

/**
 * Approximate ∫ₐᵇ f(x) dx using 20-point Gauss–Legendre quadrature.
 *
 * Exact for polynomials of degree ≤ 39. Use when no closed-form antiderivative
 * exists (e.g. DIPPR-102 with non-integer exponent c2).
 *
 * @param f  Integrand f(x)
 * @param a  Lower bound
 * @param b  Upper bound
 */
export function gaussLegendre20(f: (x: number) => number, a: number, b: number): number {
  const mid  = (a + b) / 2;
  const half = (b - a) / 2;
  let sum = 0;
  for (let i = 0; i < GL20_NODES.length; i++) {
    sum += GL20_WEIGHTS[i] * f(mid + half * GL20_NODES[i]);
  }
  return half * sum;
}

