import { Equation } from '../interfaces/equation.interface';
import { DipprN102Equation } from '../type/dippr-n102-equation';
import { Common } from './common';
import { gaussLegendre20 } from '../../utils/numeric.util';

/**
 * DIPPR Correlation 102 method.
 * Common refs: Perry9, DIPPR_Doc
 *
 * f(T) = c1·T^c2 / (1 + c3/T + c4/T²)
 */
export class DipprEquation102Method implements Equation<DipprN102Equation> {
  calculate(x: number, vars: DipprN102Equation, min: number, max: number, k = 1): number {
    x = Common.validInterval(x, min, max);
    const { c1, c2, c3, c4 } = vars;
    return (c1 * Math.pow(x, c2) / (1 + c3 / x + c4 / (x * x))) * k;
  }

  /**
   * Numerical integral via 20-point Gauss–Legendre quadrature (ref WolframAlpha).
   * No closed-form antiderivative exists for arbitrary non-integer c2.
   */
  integral(x: number, vars: DipprN102Equation, min: number, max: number, k = 1): number {
    x = Common.validInterval(x, min, max);
    return gaussLegendre20(t => this.calculate(t, vars, min, max, k), min, x);
  }

  calculateAverage(x1: number, x2: number, vars: DipprN102Equation, min: number, max: number, k = 1): number {
    x1 = Common.validInterval(x1, min, max);
    x2 = Common.validInterval(x2, min, max);
    if (Math.abs(x2 - x1) < 1e-10) return this.calculate(x1, vars, min, max, k);
    return gaussLegendre20(t => this.calculate(t, vars, min, max, k), x1, x2) / (x2 - x1);
  }
}

