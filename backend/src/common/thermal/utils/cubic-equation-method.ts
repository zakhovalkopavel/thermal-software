import { Equation } from '../interfaces/equation.interface';
import { CubicEquation } from '../type/cubic-equation';
import { Common } from './common';

/**
 * Cubic polynomial method.
 * Common refs: Borgnakke, Yaws1999
 *
 * f(T) = a + b·T + c·T² + d·T³
 */
export class CubicEquationMethod implements Equation<CubicEquation> {
  calculate(x: number, vars: CubicEquation, min: number, max: number, k = 1): number {
    x = Common.validInterval(x, min, max);
    return (vars.a + vars.b * x + vars.c * x * x + vars.d * x * x * x) * k;
  }
  /** ∫f dT = a·T + b·T²/2 + c·T³/3 + d·T⁴/4 */
  integral(x: number, vars: CubicEquation, min: number, max: number, k = 1): number {
    x = Common.validInterval(x, min, max);
    return (vars.a * x + vars.b * x * x / 2 + vars.c * x * x * x / 3 + vars.d * x * x * x * x / 4) * k;
  }
  calculateAverage(x1: number, x2: number, vars: CubicEquation, min: number, max: number, k = 1): number {
    return (this.integral(x2, vars, min, max, k) - this.integral(x1, vars, min, max, k)) / (x2 - x1);
  }
}

