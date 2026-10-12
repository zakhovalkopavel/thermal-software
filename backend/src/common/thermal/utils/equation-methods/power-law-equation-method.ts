import { Equation } from '../../interfaces/equation.interface';
import { PowerLawEquation } from '../../type/power-law-equation';
import { Common } from '../common';

/**
 * Power-law method (gas viscosity or thermal conductivity).
 * ref: White3 (Eqs. 1-35, 1-44a)
 *
 * y = y0·(T/T0)^n
 */
export class PowerLawEquationMethod implements Equation<PowerLawEquation> {
  calculate(x: number, vars: PowerLawEquation, min: number, max: number, k = 1): number {
    x = Common.validInterval(x, min, max);
    return vars.y0 * Math.pow(x / vars.T0, vars.n) * k;
  }

  /** ∫y dT = y0·T0/(n + 1)·(T/T0)^(n + 1);  y0·T0·ln(T) for n = −1 */
  integral(x: number, vars: PowerLawEquation, min: number, max: number, k = 1): number {
    x = Common.validInterval(x, min, max);
    const { y0, T0, n } = vars;
    if (n === -1) return y0 * T0 * Math.log(x) * k;
    return y0 * T0 / (n + 1) * Math.pow(x / T0, n + 1) * k;
  }

  calculateAverage(x1: number, x2: number, vars: PowerLawEquation, min: number, max: number, k = 1): number {
    x1 = Common.validInterval(x1, min, max);
    x2 = Common.validInterval(x2, min, max);
    if (Math.abs(x2 - x1) < 1e-10) return this.calculate(x1, vars, min, max, k);
    return (this.integral(x2, vars, min, max, k) - this.integral(x1, vars, min, max, k)) / (x2 - x1);
  }
}
