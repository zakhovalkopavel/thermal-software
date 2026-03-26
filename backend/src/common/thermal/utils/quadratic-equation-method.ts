import { Equation } from '../interfaces/equation.interface';
import { QuadraticEquation } from '../type/quadratic-equation';
import { Common } from './common';

/**
 * Quadratic polynomial method.
 * Common refs: Yaws1999, Incropera
 *
 * f(T) = a + b·T + c·T²
 */
export class QuadraticEquationMethod implements Equation<QuadraticEquation> {
  calculate(x: number, vars: QuadraticEquation, min: number, max: number, k = 1): number {
    x = Common.validInterval(x, min, max);
    return (vars.a + vars.b * x + vars.c * x * x) * k;
  }
  /** ∫f dT = a·T + b·T²/2 + c·T³/3 */
  integral(x: number, vars: QuadraticEquation, min: number, max: number, k = 1): number {
    x = Common.validInterval(x, min, max);
    return (vars.a * x + vars.b * x * x / 2 + vars.c * x * x * x / 3) * k;
  }
  calculateAverage(x1: number, x2: number, vars: QuadraticEquation, min: number, max: number, k = 1): number {
    return (this.integral(x2, vars, min, max, k) - this.integral(x1, vars, min, max, k)) / (x2 - x1);
  }
}

