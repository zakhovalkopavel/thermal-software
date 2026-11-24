import { Equation } from '../../interfaces/equation.interface';
import { TrcCpEquation } from '../../type/trc-cp-equation';
import { Common } from '../common';

/**
 * TRC ideal-gas heat capacity method; returns Cp/R (the dataset sets k = R).
 * Common refs: TRC1994; chemicals TRCCp, TRCCp_integral
 *
 * Cp/R = a0 + (a1/T²)·exp(−a2/T) + a3·y² + (a4 − a5/(T − a7)²)·y⁸,  y = (T − a7)/(T + a6) for T > a7, else 0
 */
export class TrcCpEquationMethod implements Equation<TrcCpEquation> {
  calculate(x: number, vars: TrcCpEquation, min: number, max: number, k = 1): number {
    x = Common.validInterval(x, min, max);
    const { a0, a1, a2, a3, a4, a5, a6, a7 } = vars;
    const y = x <= a7 ? 0 : (x - a7) / (x + a6);
    const exponential = a1 === 0 ? 0 : a1 / (x * x) * Math.exp(-a2 / x);
    const y8 = y === 0 ? 0 : (a4 - a5 / Math.pow(x - a7, 2)) * Math.pow(y, 8);
    return (a0 + exponential + a3 * y * y + y8) * k;
  }

  /**
   * H/R = a0·T + (a1/a2)·exp(−a2/T) + I + h(T)  (−a1/T instead of the exp term when a2 = 0)
   * h = (a6 + a7)·[(2·a3 + 8·a4)·ln(1 − y) + (a3·(1 + 1/(1 − y)) + a4·(7 + 1/(1 − y)))·y
   *     + a4·(3·y² + 5·y³/3 + y⁴ + 3·y⁵/5 + y⁶/3) + (a4 − a5/(a6 + a7)²)·y⁷/7]  for T > a7, else 0
   */
  integral(x: number, vars: TrcCpEquation, min: number, max: number, k = 1): number {
    x = Common.validInterval(x, min, max);
    const { a0, a1, a2, a3, a4, a5, a6, a7, I } = vars;
    const exponential = a2 === 0 ? -a1 / x : a1 / a2 * Math.exp(-a2 / x);
    let h = 0;
    if (x > a7) {
      const y = (x - a7) / (x + a6);
      const inv = 1 / (1 - y);
      h = (a6 + a7) * ((2 * a3 + 8 * a4) * Math.log(1 - y) + (a3 * (1 + inv) + a4 * (7 + inv)) * y
        + a4 * (3 * y * y + 5 * Math.pow(y, 3) / 3 + Math.pow(y, 4) + 3 * Math.pow(y, 5) / 5 + Math.pow(y, 6) / 3)
        + (a4 - a5 / Math.pow(a6 + a7, 2)) * Math.pow(y, 7) / 7);
    }
    return (a0 * x + exponential + I + h) * k;
  }

  calculateAverage(x1: number, x2: number, vars: TrcCpEquation, min: number, max: number, k = 1): number {
    x1 = Common.validInterval(x1, min, max);
    x2 = Common.validInterval(x2, min, max);
    if (Math.abs(x2 - x1) < 1e-10) return this.calculate(x1, vars, min, max, k);
    return (this.integral(x2, vars, min, max, k) - this.integral(x1, vars, min, max, k)) / (x2 - x1);
  }
}
