import { Equation } from '../interfaces/equation.interface';

export interface QuarticVars { a: number; b: number; c: number; d: number; e: number; }

export class QuarticEquationMethod implements Equation<QuarticVars> {
  calculate(x: number, vars: QuarticVars, min: number, max: number, k = 1): number {
    x = Math.min(Math.max(x, min), max);
    return (vars.a + vars.b * x + vars.c * x * x + vars.d * Math.pow(x, 3) + vars.e * Math.pow(x, 4)) * k;
  }
  integral(x: number, vars: QuarticVars, min: number, max: number, k = 1): number {
    x = Math.min(Math.max(x, min), max);
    return (vars.a * x + vars.b * x * x / 2 + vars.c * Math.pow(x, 3) / 3 +
            vars.d * Math.pow(x, 4) / 4 + vars.e * Math.pow(x, 5) / 5) * k;
  }
  calculateAverage(x1: number, x2: number, vars: QuarticVars, min: number, max: number, k = 1): number {
    return (this.integral(x2, vars, min, max, k) - this.integral(x1, vars, min, max, k)) / (x2 - x1);
  }
}

