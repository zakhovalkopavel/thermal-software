import { Equation } from '../interfaces/equation.interface';
import { LinearHyperbolicLogarithmicEquation } from '../type/linear-hyperbolic-logarithmic-equation';
import { Common } from './common';

/**
 * Linear-hyperbolic-logarithmic polynomial method.
 * Common refs: Perry9, DIPPR_Doc
 *
 * f(T) = c1 + c2·ln T + c3/T + c4·T
 */
export class LinearHyperbolicLogarithmicEquationMethod implements Equation<LinearHyperbolicLogarithmicEquation> {
  calculate(x: number, vars: LinearHyperbolicLogarithmicEquation, min: number, max: number, k = 1): number {
    x = Common.validInterval(x, min, max);
    return (vars.c1 + vars.c2 * Math.log(x) + vars.c3 / x + vars.c4 * x) * k;
  }
  /**
   * Exact antiderivative (verified via WolframAlpha — ref WolframAlpha):
   * ∫f dT = c1·T + c2·(T·ln T − T) + c3·ln T + c4·T²/2
   */
  integral(x: number, vars: LinearHyperbolicLogarithmicEquation, min: number, max: number, k = 1): number {
    x = Common.validInterval(x, min, max);
    return (vars.c1 * x + vars.c2 * (x * Math.log(x) - x) + vars.c3 * Math.log(x) + vars.c4 * x * x / 2) * k;
  }
  calculateAverage(x1: number, x2: number, vars: LinearHyperbolicLogarithmicEquation, min: number, max: number, k = 1): number {
    return (this.integral(x2, vars, min, max, k) - this.integral(x1, vars, min, max, k)) / (x2 - x1);
  }
}

