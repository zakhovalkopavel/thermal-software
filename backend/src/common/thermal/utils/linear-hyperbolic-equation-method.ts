import { Equation } from '../interfaces/equation.interface';

/** a + b·T + d/T²  (linearHyperbolic) */
export interface LinearHyperbolicVars { a: number; b: number; d: number; }

export class LinearHyperbolicEquationMethod implements Equation<LinearHyperbolicVars> {
  calculate(x: number, vars: LinearHyperbolicVars, min: number, max: number, k = 1): number {
    x = Math.min(Math.max(x, min), max);
    return (vars.a + vars.b * x + vars.d / (x * x)) * k;
  }
  integral(x: number, vars: LinearHyperbolicVars, min: number, max: number, k = 1): number {
    x = Math.min(Math.max(x, min), max);
    return (vars.a * x + vars.b * x * x / 2 - vars.d / x) * k;
  }
  calculateAverage(x1: number, x2: number, vars: LinearHyperbolicVars, min: number, max: number, k = 1): number {
    return (this.integral(x2, vars, min, max, k) - this.integral(x1, vars, min, max, k)) / (x2 - x1);
  }
}

