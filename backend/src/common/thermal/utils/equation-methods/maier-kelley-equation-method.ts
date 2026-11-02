import { Equation } from '../../interfaces/equation.interface';
import { MaierKelleyEquation } from '../../type/maier-kelley-equation';
import { Common } from '../common';

/**
 * Maier–Kelley equation method (1932).
 * Common refs: Szargut, Perry7, Perry8 Table 2-151
 *
 * f(T) = a + b·T + d/T²
 */
export class MaierKelleyEquationMethod implements Equation<MaierKelleyEquation> {
  calculate(x: number, vars: MaierKelleyEquation, min: number, max: number, k = 1): number {
    x = Common.validInterval(x, min, max);
    return (vars.a + vars.b * x + vars.d / (x * x)) * k;
  }
  /** ∫f dT = a·T + b·T²/2 − d/T */
  integral(x: number, vars: MaierKelleyEquation, min: number, max: number, k = 1): number {
    x = Common.validInterval(x, min, max);
    return (vars.a * x + vars.b * x * x / 2 - vars.d / x) * k;
  }
  calculateAverage(x1: number, x2: number, vars: MaierKelleyEquation, min: number, max: number, k = 1): number {
    return (this.integral(x2, vars, min, max, k) - this.integral(x1, vars, min, max, k)) / (x2 - x1);
  }
}
