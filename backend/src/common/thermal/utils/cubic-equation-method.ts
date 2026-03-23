import { Equation } from '../interfaces/equation.interface';

export interface CubicVars { a: number; b: number; c: number; d: number; }

export class CubicEquationMethod implements Equation<CubicVars> {
  calculate(x: number, vars: CubicVars, min: number, max: number, k = 1): number {
    x = Math.min(Math.max(x, min), max);
    return (vars.a + vars.b * x + vars.c * x * x + vars.d * x * x * x) * k;
  }
  integral(x: number, vars: CubicVars, min: number, max: number, k = 1): number {
    x = Math.min(Math.max(x, min), max);
    return (vars.a * x + vars.b * x * x / 2 + vars.c * x * x * x / 3 + vars.d * x * x * x * x / 4) * k;
  }
  calculateAverage(x1: number, x2: number, vars: CubicVars, min: number, max: number, k = 1): number {
    return (this.integral(x2, vars, min, max, k) - this.integral(x1, vars, min, max, k)) / (x2 - x1);
  }
}

