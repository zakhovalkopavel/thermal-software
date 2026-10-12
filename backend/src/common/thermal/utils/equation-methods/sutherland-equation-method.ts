import { Equation } from '../../interfaces/equation.interface';
import { SutherlandEquation } from '../../type/sutherland-equation';
import { Common } from '../common';

/**
 * Sutherland law method (gas viscosity or thermal conductivity).
 * ref: White3 (Eqs. 1-36, 1-44b)
 *
 * y = y0·(T/T0)^1.5·(T0 + S)/(T + S)
 */
export class SutherlandEquationMethod implements Equation<SutherlandEquation> {
  calculate(x: number, vars: SutherlandEquation, min: number, max: number, k = 1): number {
    x = Common.validInterval(x, min, max);
    const { y0, T0, S } = vars;
    return y0 * Math.pow(x / T0, 1.5) * (T0 + S) / (x + S) * k;
  }

  /** ∫y dT = y0·(T0 + S)/T0^1.5 · 2·[T^1.5/3 − S·√T + S^1.5·atan(√(T/S))]  (u = √T) */
  integral(x: number, vars: SutherlandEquation, min: number, max: number, k = 1): number {
    x = Common.validInterval(x, min, max);
    const { y0, T0, S } = vars;
    const bracket = Math.pow(x, 1.5) / 3 - S * Math.sqrt(x) + Math.pow(S, 1.5) * Math.atan(Math.sqrt(x / S));
    return y0 * (T0 + S) / Math.pow(T0, 1.5) * 2 * bracket * k;
  }

  calculateAverage(x1: number, x2: number, vars: SutherlandEquation, min: number, max: number, k = 1): number {
    x1 = Common.validInterval(x1, min, max);
    x2 = Common.validInterval(x2, min, max);
    if (Math.abs(x2 - x1) < 1e-10) return this.calculate(x1, vars, min, max, k);
    return (this.integral(x2, vars, min, max, k) - this.integral(x1, vars, min, max, k)) / (x2 - x1);
  }
}
