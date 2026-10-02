import { AdaptiveIntegrateOptions } from './adaptive-integrate-options.interface';
import { clenshawCurtis } from './clenshaw-curtis.util';
import { gaussLegendre } from './gauss-legendre.util';
import { GaussNodeCount } from './gauss-node-count.type';
import { QUADRATURE } from './quadrature.constants';

/**
 * Returns true if the integrand appears to oscillate on [a, b].
 * Counts zero-crossings on a coarse uniform mesh of OSCILLATION_PROBE_POINTS points.
 */
function isOscillating(f: (x: number) => number, a: number, b: number): boolean {
  const step = (b - a) / (QUADRATURE.OSCILLATION_PROBE_POINTS - 1);
  let signChanges = 0;
  let prev = f(a);
  for (let i = 1; i < QUADRATURE.OSCILLATION_PROBE_POINTS; i++) {
    const cur = f(a + i * step);
    if (prev * cur < 0) signChanges++;
    prev = cur;
  }
  return signChanges >= QUADRATURE.OSCILLATION_THRESHOLD;
}

/**
 * Numerically integrate f on [a, b], automatically choosing between
 * Gauss–Legendre (smooth) and Clenshaw–Curtis (oscillating).
 *
 * Rule of thumb used by the auto-selector:
 *   oscillating  ≡  at least OSCILLATION_THRESHOLD sign changes in OSCILLATION_PROBE_POINTS samples
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
