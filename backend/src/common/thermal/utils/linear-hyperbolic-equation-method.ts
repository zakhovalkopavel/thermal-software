import { Equation } from '../interfaces/equation.interface';
import { LinearHyperbolicEquation } from '../type/linear-hyperbolic-equation';
import { Common } from './common';

/**
 * Linear-hyperbolic polynomial method (Szargut form).
 * Common refs: Szargut, Perry7
 *
 * f(T) = a + b·T + d/T²
 */
export class LinearHyperbolicEquationMethod implements Equation<LinearHyperbolicEquation> {
  calculate(x: number, vars: LinearHyperbolicEquation, min: number, max: number, k = 1): number {
    x = Common.validInterval(x, min, max);
    return (vars.a + vars.b * x + vars.d / (x * x)) * k;
  }
  /** ∫f dT = a·T + b·T²/2 − d/T */
  integral(x: number, vars: LinearHyperbolicEquation, min: number, max: number, k = 1): number {
    x = Common.validInterval(x, min, max);
    return (vars.a * x + vars.b * x * x / 2 - vars.d / x) * k;
  }
  calculateAverage(x1: number, x2: number, vars: LinearHyperbolicEquation, min: number, max: number, k = 1): number {
    return (this.integral(x2, vars, min, max, k) - this.integral(x1, vars, min, max, k)) / (x2 - x1);
  }
}

