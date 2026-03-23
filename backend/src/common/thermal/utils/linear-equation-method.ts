import { Equation } from '../interfaces/equation.interface';

export interface LinearVars { a: number; b: number; }

export class LinearEquationMethod implements Equation<LinearVars> {
  calculate(x: number, vars: LinearVars, min: number, max: number, k = 1): number {
    x = Math.min(Math.max(x, min), max);
    return (vars.a + vars.b * x) * k;
  }
  integral(x: number, vars: LinearVars, min: number, max: number, k = 1): number {
    x = Math.min(Math.max(x, min), max);
    return (vars.a * x + vars.b * x * x / 2) * k;
  }
  calculateAverage(x1: number, x2: number, vars: LinearVars, min: number, max: number, k = 1): number {
    return (this.integral(x2, vars, min, max, k) - this.integral(x1, vars, min, max, k)) / (x2 - x1);
  }
}

