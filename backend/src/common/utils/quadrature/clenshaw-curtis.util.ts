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
 * Optimal for oscillating or weakly singular integrands (e.g. integrands
 * containing cos(μₙ x/R), J₀(pₙ r), products of Bessel functions).
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
