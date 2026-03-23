import { Equation } from '../interfaces/equation.interface';

/**
 * Aly-Lee equation:
 * Cp = c1 + c2·[(c3/T)/sinh(c3/T)]² + c4·[(c5/T)/cosh(c5/T)]²
 */
export interface AlyLeeVars { c1: number; c2: number; c3: number; c4: number; c5: number; }

export class AlyLeeEquationMethod implements Equation<AlyLeeVars> {
  calculate(x: number, vars: AlyLeeVars, min: number, max: number, k = 1): number {
    x = Math.min(Math.max(x, min), max);
    const { c1, c2, c3, c4, c5 } = vars;
    const t1 = (c3 / x) / Math.sinh(c3 / x);
    const t2 = (c5 / x) / Math.cosh(c5 / x);
    return (c1 + c2 * t1 * t1 + c4 * t2 * t2) * k;
  }

  /**
   * Numerical integral using 20-point Gauss-Legendre quadrature.
   * The Aly-Lee equation has no closed-form antiderivative.
   */
  integral(x: number, vars: AlyLeeVars, min: number, max: number, k = 1): number {
    // Integrate from min to x using Gauss-Legendre (20 points)
    const a = Math.min(Math.max(min, min), Math.min(Math.max(x, min), max));
    const b = Math.min(Math.max(x, min), max);
    return gaussLegendre20(t => this.calculate(t, vars, min, max, k), min, b);
  }

  calculateAverage(x1: number, x2: number, vars: AlyLeeVars, min: number, max: number, k = 1): number {
    x1 = Math.min(Math.max(x1, min), max);
    x2 = Math.min(Math.max(x2, min), max);
    if (Math.abs(x2 - x1) < 1e-10) return this.calculate(x1, vars, min, max, k);
    return gaussLegendre20(t => this.calculate(t, vars, min, max, k), x1, x2) / (x2 - x1);
  }
}

// 20-point Gauss-Legendre nodes and weights on [-1, 1]
const GL20_NODES = [
  -0.9931285991850949, -0.9639719272779138, -0.9122344282513259, -0.8391169718222188,
  -0.7463062256567499, -0.6360536807265150, -0.5108670019508271, -0.3737060887154195,
  -0.2277858511416451, -0.0765265211334973,
   0.0765265211334973,  0.2277858511416451,  0.3737060887154195,  0.5108670019508271,
   0.6360536807265150,  0.7463062256567499,  0.8391169718222188,  0.9122344282513259,
   0.9639719272779138,  0.9931285991850949,
];
const GL20_WEIGHTS = [
  0.0176140071391521, 0.0406014298003869, 0.0626720483341091, 0.0832767415767048,
  0.1019301198172404, 0.1181945319615184, 0.1316886384491766, 0.1420961093183820,
  0.1491729864726037, 0.1527533871307258,
  0.1527533871307258, 0.1491729864726037, 0.1420961093183820, 0.1316886384491766,
  0.1181945319615184, 0.1019301198172404, 0.0832767415767048, 0.0626720483341091,
  0.0406014298003869, 0.0176140071391521,
];

function gaussLegendre20(f: (x: number) => number, a: number, b: number): number {
  const mid = (a + b) / 2;
  const half = (b - a) / 2;
  let sum = 0;
  for (let i = 0; i < 20; i++) sum += GL20_WEIGHTS[i] * f(mid + half * GL20_NODES[i]);
  return half * sum;
}

