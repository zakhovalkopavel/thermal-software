import { Equation } from '../interfaces/equation.interface';

/** c1 + c2·ln T + c3/T + c4·T  (linearHyperbolicLogarithmic) */
export interface LinearHyperbolicLogarithmicVars { c1: number; c2: number; c3: number; c4: number; }

export class LinearHyperbolicLogarithmicEquationMethod implements Equation<LinearHyperbolicLogarithmicVars> {
  calculate(x: number, vars: LinearHyperbolicLogarithmicVars, min: number, max: number, k = 1): number {
    x = Math.min(Math.max(x, min), max);
    return (vars.c1 + vars.c2 * Math.log(x) + vars.c3 / x + vars.c4 * x) * k;
  }
  integral(x: number, vars: LinearHyperbolicLogarithmicVars, min: number, max: number, k = 1): number {
    x = Math.min(Math.max(x, min), max);
    return (vars.c1 * x + vars.c2 * (x * Math.log(x) - x) + vars.c3 * Math.log(x) + vars.c4 * x * x / 2) * k;
  }
  calculateAverage(x1: number, x2: number, vars: LinearHyperbolicLogarithmicVars, min: number, max: number, k = 1): number {
    return (this.integral(x2, vars, min, max, k) - this.integral(x1, vars, min, max, k)) / (x2 - x1);
  }
}

