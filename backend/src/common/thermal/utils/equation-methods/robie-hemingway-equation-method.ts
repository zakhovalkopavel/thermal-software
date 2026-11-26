import { Equation } from '../../interfaces/equation.interface';
import { RobieHemingwayEquation } from '../../type/robie-hemingway-equation';
import { RobieHemingwayRange } from '../../type/robie-hemingway-range';
import { Common } from '../common';
import { piecewiseIntegral } from './piecewise-integral.util';
import { temperatureRangeIndex } from './temperature-range-index.util';

/**
 * Piecewise Robie–Hemingway heat capacity method.
 * Ref: RobieHemingway1995 (USGS Bulletin 2131)
 *
 * Cp = A1 + A2·T + A3/T² + A4/T^0.5 + A5·T²
 *
 * `integral` is cumulative from `ranges[0].Tmin` and continuous at range boundaries.
 */
export class RobieHemingwayEquationMethod implements Equation<RobieHemingwayEquation> {
  calculate(x: number, vars: RobieHemingwayEquation, min: number, max: number, k = 1): number {
    x = Common.validInterval(x, min, max);
    const r = vars.ranges[temperatureRangeIndex(x, vars.ranges)];
    return this._cp(x, r) * k;
  }

  /**
   * Per range: F(T) = A1·T + A2·T²/2 − A3/T + 2·A4·T^0.5 + A5·T³/3
   */
  integral(x: number, vars: RobieHemingwayEquation, min: number, max: number, k = 1): number {
    x = Common.validInterval(x, min, max);
    return piecewiseIntegral(x, vars.ranges, this._antiderivative) * k;
  }

  calculateAverage(x1: number, x2: number, vars: RobieHemingwayEquation, min: number, max: number, k = 1): number {
    x1 = Common.validInterval(x1, min, max);
    x2 = Common.validInterval(x2, min, max);
    if (Math.abs(x2 - x1) < 1e-10) return this.calculate(x1, vars, min, max, k);
    return (this.integral(x2, vars, min, max, k) - this.integral(x1, vars, min, max, k)) / (x2 - x1);
  }

  private _cp(T: number, r: RobieHemingwayRange): number {
    return r.A1 + r.A2 * T + r.A3 / (T * T) + r.A4 / Math.sqrt(T) + r.A5 * T * T;
  }

  private _antiderivative(T: number, r: RobieHemingwayRange): number {
    return (
      r.A1 * T
      + r.A2 * T * T / 2
      - r.A3 / T
      + 2 * r.A4 * Math.sqrt(T)
      + r.A5 * Math.pow(T, 3) / 3
    );
  }
}
