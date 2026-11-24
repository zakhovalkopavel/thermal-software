import { Equation } from '../../interfaces/equation.interface';
import { ShomateEquation } from '../../type/shomate-equation';
import { ShomateRange } from '../../type/shomate-range';
import { Common } from '../common';
import { piecewiseIntegral } from './piecewise-integral.util';
import { temperatureRangeIndex } from './temperature-range-index.util';

/**
 * Piecewise Shomate heat capacity method.
 * Common refs: NISTWebBook; chemicals Shomate, Shomate_integral
 *
 * Cp = a + b·T + c·T² + d·T³ + e/T²  (coefficients already converted to T in K)
 *
 * `integral` is cumulative from `ranges[0].Tmin` and continuous at the range boundaries.
 */
export class ShomateEquationMethod implements Equation<ShomateEquation> {
  calculate(x: number, vars: ShomateEquation, min: number, max: number, k = 1): number {
    x = Common.validInterval(x, min, max);
    const { a, b, c, d, e } = vars.ranges[temperatureRangeIndex(x, vars.ranges)];
    return (a + b * x + c * x * x + d * Math.pow(x, 3) + e / (x * x)) * k;
  }

  /** Per range: F(T) = a·T + b·T²/2 + c·T³/3 + d·T⁴/4 − e/T */
  integral(x: number, vars: ShomateEquation, min: number, max: number, k = 1): number {
    x = Common.validInterval(x, min, max);
    return piecewiseIntegral(x, vars.ranges, this._antiderivative) * k;
  }

  calculateAverage(x1: number, x2: number, vars: ShomateEquation, min: number, max: number, k = 1): number {
    x1 = Common.validInterval(x1, min, max);
    x2 = Common.validInterval(x2, min, max);
    if (Math.abs(x2 - x1) < 1e-10) return this.calculate(x1, vars, min, max, k);
    return (this.integral(x2, vars, min, max, k) - this.integral(x1, vars, min, max, k)) / (x2 - x1);
  }

  private _antiderivative(T: number, r: ShomateRange): number {
    return r.a * T + r.b * T * T / 2 + r.c * Math.pow(T, 3) / 3 + r.d * Math.pow(T, 4) / 4 - r.e / T;
  }
}
