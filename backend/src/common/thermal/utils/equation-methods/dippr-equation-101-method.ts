import { Equation } from '../../interfaces/equation.interface';
import { DipprN101Equation } from '../../type/dippr-n101-equation';
import { Common } from '../common';
import { gaussLegendre20 } from '../../../utils/quadrature';
import { integrationOrigin } from './integration-origin.util';

/**
 * DIPPR Correlation 101 method.
 * Common refs: Perry8, DIPPR_Doc; chemicals EQ101
 *
 * f(T) = exp(c1 + c2/T + c3·ln(T) + c4·T^c5)
 */
export class DipprEquation101Method implements Equation<DipprN101Equation> {
  calculate(x: number, vars: DipprN101Equation, min: number, max: number, k = 1): number {
    x = Common.validInterval(x, min, max);
    const { c1, c2, c3, c4, c5 } = vars;
    return Math.exp(c1 + c2 / x + c3 * Math.log(x) + c4 * Math.pow(x, c5)) * k;
  }

  /** Numerical integral via 20-point Gauss–Legendre quadrature; no closed form exists. */
  integral(x: number, vars: DipprN101Equation, min: number, max: number, k = 1): number {
    x = Common.validInterval(x, min, max);
    return gaussLegendre20(t => this.calculate(t, vars, min, max, k), integrationOrigin(min), x);
  }

  calculateAverage(x1: number, x2: number, vars: DipprN101Equation, min: number, max: number, k = 1): number {
    x1 = Common.validInterval(x1, min, max);
    x2 = Common.validInterval(x2, min, max);
    if (Math.abs(x2 - x1) < 1e-10) return this.calculate(x1, vars, min, max, k);
    return gaussLegendre20(t => this.calculate(t, vars, min, max, k), x1, x2) / (x2 - x1);
  }
}
