import { Equation } from '../../interfaces/equation.interface';
import { LinearEquation } from '../../type/linear-equation';
import { Common } from '../common';

/**
 * Linear polynomial method.
 * Common refs: Szargut, Borgnakke
 *
 * f(T) = a + b·T
 */
export class LinearEquationMethod implements Equation<LinearEquation> {
  calculate(x: number, vars: LinearEquation, min: number, max: number, k = 1): number {
    x = Common.validInterval(x, min, max);
    return (vars.a + vars.b * x) * k;
  }
  /** ∫f dT = a·T + b·T²/2 */
  integral(x: number, vars: LinearEquation, min: number, max: number, k = 1): number {
    x = Common.validInterval(x, min, max);
    return (vars.a * x + vars.b * x * x / 2) * k;
  }
  calculateAverage(x1: number, x2: number, vars: LinearEquation, min: number, max: number, k = 1): number {
    return Common.averageOverClampedInterval(
      x => this.integral(x, vars, min, max, k),
      x => this.calculate(x, vars, min, max, k),
      x1, x2, min, max,
    );
  }
}

