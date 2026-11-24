import { CubicSplineResult } from './types/cubic-spline-result.type';

/**
 * Natural cubic spline through (x[i], y[i]).
 * Equivalent to: scipy.interpolate.CubicSpline(x, y, bc_type='natural')
 *
 * Requires ≥ 2 points; for n = 2 falls back to linear interpolation.
 * Evaluation outside [xMin, xMax] throws (no extrapolation).
 */
export function cubicSpline(x: number[], y: number[]): CubicSplineResult {
  if (x.length !== y.length) {
    throw new Error('cubicSpline: x and y must have the same length');
  }
  if (x.length < 2) {
    throw new Error('cubicSpline: need at least 2 points');
  }

  const n = x.length;
  const xs = x.slice();
  const ys = y.slice();

  // Ensure strictly increasing x
  const order = xs.map((_, i) => i).sort((a, b) => xs[a] - xs[b]);
  const X = order.map(i => xs[i]);
  const Y = order.map(i => ys[i]);
  for (let i = 1; i < n; i++) {
    if (!(X[i] > X[i - 1])) {
      throw new Error('cubicSpline: x must be strictly increasing');
    }
  }

  const xMin = X[0];
  const xMax = X[n - 1];

  if (n === 2) {
    const slope = (Y[1] - Y[0]) / (X[1] - X[0]);
    return {
      xMin,
      xMax,
      evaluate: (xq: number) => {
        assertInRange(xq, xMin, xMax);
        return Y[0] + slope * (xq - X[0]);
      },
    };
  }

  // Second derivatives m[i] for natural spline (m[0] = m[n-1] = 0)
  const h: number[] = new Array(n - 1);
  for (let i = 0; i < n - 1; i++) h[i] = X[i + 1] - X[i];

  const a: number[] = new Array(n).fill(0);
  const b: number[] = new Array(n).fill(0);
  const c: number[] = new Array(n).fill(0);
  const d: number[] = new Array(n).fill(0);

  b[0] = 1;
  b[n - 1] = 1;
  for (let i = 1; i < n - 1; i++) {
    a[i] = h[i - 1];
    b[i] = 2 * (h[i - 1] + h[i]);
    c[i] = h[i];
    d[i] = 6 * ((Y[i + 1] - Y[i]) / h[i] - (Y[i] - Y[i - 1]) / h[i - 1]);
  }

  const m = solveTridiagonal(a, b, c, d);

  return {
    xMin,
    xMax,
    evaluate: (xq: number) => {
      assertInRange(xq, xMin, xMax);
      // Find interval
      let i = 0;
      if (xq === X[n - 1]) i = n - 2;
      else {
        let lo = 0;
        let hi = n - 2;
        while (lo <= hi) {
          const mid = (lo + hi) >> 1;
          if (xq < X[mid]) hi = mid - 1;
          else if (xq >= X[mid + 1]) lo = mid + 1;
          else {
            i = mid;
            break;
          }
        }
        if (lo > hi) i = Math.max(0, Math.min(n - 2, lo));
      }

      const hi = h[i];
      const dx = xq - X[i];
      const t = X[i + 1] - xq;
      return (
        (m[i] * t * t * t + m[i + 1] * dx * dx * dx) / (6 * hi)
        + (Y[i] / hi - (m[i] * hi) / 6) * t
        + (Y[i + 1] / hi - (m[i + 1] * hi) / 6) * dx
      );
    },
  };
}

function assertInRange(x: number, xMin: number, xMax: number): void {
  if (x < xMin || x > xMax) {
    throw new Error(
      `cubicSpline: x=${x} outside domain [${xMin}, ${xMax}]`,
    );
  }
}

/** Thomas algorithm for tridiagonal system. */
function solveTridiagonal(
  a: number[],
  b: number[],
  c: number[],
  d: number[],
): number[] {
  const n = b.length;
  const cp = c.slice();
  const dp = d.slice();
  const bp = b.slice();

  for (let i = 1; i < n; i++) {
    const w = a[i] / bp[i - 1];
    bp[i] -= w * cp[i - 1];
    dp[i] -= w * dp[i - 1];
  }

  const x = new Array(n).fill(0);
  x[n - 1] = dp[n - 1] / bp[n - 1];
  for (let i = n - 2; i >= 0; i--) {
    x[i] = (dp[i] - cp[i] * x[i + 1]) / bp[i];
  }
  return x;
}
