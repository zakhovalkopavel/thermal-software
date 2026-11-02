import { Equation } from '../../interfaces/equation.interface';
import { DipprN107Equation } from '../../type/dippr-n107-equation';
import { Common } from '../common';

/**
 * DIPPR Equation 107 method (proposed by Aly and Lee).
 * Common refs: Perry7, Perry9
 *
 * Cp = c1 + c2·[c3/T / sinh(c3/T)]² + c4·[c5/T / cosh(c5/T)]²
 */
export class DipprEquation107Method implements Equation<DipprN107Equation> {
  calculate(x: number, vars: DipprN107Equation, min: number, max: number, k = 1): number {
    x = Common.validInterval(x, min, max);
    const { c1, c2, c3, c4, c5 } = vars;
    const t1 = (c3 / x) / Math.sinh(c3 / x);
    const t2 = (c5 / x) / Math.cosh(c5 / x);
    return (c1 + c2 * t1 * t1 + c4 * t2 * t2) * k;
  }
  /**
   * Exact antiderivative (verified via WolframAlpha):
   * ∫Cp dT = c1·T + c2·c3·coth(c3/T) − c4·c5·tanh(c5/T)
   */
  integral(x: number, vars: DipprN107Equation, min: number, max: number, k = 1): number {
    x = Common.validInterval(x, min, max);
    const { c1, c2, c3, c4, c5 } = vars;
    return (c1 * x + c2 * c3 / Math.tanh(c3 / x) - c4 * c5 * Math.tanh(c5 / x)) * k;
  }
  calculateAverage(x1: number, x2: number, vars: DipprN107Equation, min: number, max: number, k = 1): number {
    return (this.integral(x2, vars, min, max, k) - this.integral(x1, vars, min, max, k)) / (x2 - x1);
  }
}
