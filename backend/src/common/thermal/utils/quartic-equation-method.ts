import { Equation } from '../interfaces/equation.interface';
import { QuarticEquation } from '../type/quartic-equation';
import { Common } from './common';

/**
 * Quartic polynomial method.
 * Common refs: Yaws1999, Borgnakke
 *
 * f(T) = a + b·T + c·T² + d·T³ + e·T⁴
 */
export class QuarticEquationMethod implements Equation<QuarticEquation> {
  calculate(x: number, vars: QuarticEquation, min: number, max: number, k = 1): number {
    x = Common.validInterval(x, min, max);
    return (vars.a + vars.b * x + vars.c * x * x + vars.d * Math.pow(x, 3) + vars.e * Math.pow(x, 4)) * k;
  }
  /** ∫f dT = a·T + b·T²/2 + c·T³/3 + d·T⁴/4 + e·T⁵/5 */
  integral(x: number, vars: QuarticEquation, min: number, max: number, k = 1): number {
    x = Common.validInterval(x, min, max);
    return (vars.a * x + vars.b * x * x / 2 + vars.c * Math.pow(x, 3) / 3 +
            vars.d * Math.pow(x, 4) / 4 + vars.e * Math.pow(x, 5) / 5) * k;
  }
  calculateAverage(x1: number, x2: number, vars: QuarticEquation, min: number, max: number, k = 1): number {
    return (this.integral(x2, vars, min, max, k) - this.integral(x1, vars, min, max, k)) / (x2 - x1);
  }
}

