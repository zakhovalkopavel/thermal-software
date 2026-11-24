import { Equation } from '../../interfaces/equation.interface';
import { ZabranskySplineEquation } from '../../type/zabransky-spline-equation';
import { ZabranskySplineRange } from '../../type/zabransky-spline-range';
import { Common } from '../common';
import { piecewiseIntegral } from './piecewise-integral.util';
import { temperatureRangeIndex } from './temperature-range-index.util';

/**
 * Piecewise Zabransky liquid heat capacity method; returns Cp/R (the dataset sets k = R).
 * Common refs: Zabransky1996; chemicals Zabransky_cubic, Zabransky_cubic_integral
 *
 * Cp/R = a1 + a2·θ + a3·θ² + a4·θ³,  θ = T/100
 *
 * `integral` is cumulative from `ranges[0].Tmin` and continuous at the range boundaries.
 */
export class ZabranskySplineEquationMethod implements Equation<ZabranskySplineEquation> {
  calculate(x: number, vars: ZabranskySplineEquation, min: number, max: number, k = 1): number {
    x = Common.validInterval(x, min, max);
    const { a1, a2, a3, a4 } = vars.ranges[temperatureRangeIndex(x, vars.ranges)];
    const theta = x / 100;
    return (a1 + a2 * theta + a3 * theta * theta + a4 * Math.pow(theta, 3)) * k;
  }

  /** Per range: F(T) = 100·θ·(a1 + a2·θ/2 + a3·θ²/3 + a4·θ³/4) */
  integral(x: number, vars: ZabranskySplineEquation, min: number, max: number, k = 1): number {
    x = Common.validInterval(x, min, max);
    return piecewiseIntegral(x, vars.ranges, this._antiderivative) * k;
  }

  calculateAverage(x1: number, x2: number, vars: ZabranskySplineEquation, min: number, max: number, k = 1): number {
    x1 = Common.validInterval(x1, min, max);
    x2 = Common.validInterval(x2, min, max);
    if (Math.abs(x2 - x1) < 1e-10) return this.calculate(x1, vars, min, max, k);
    return (this.integral(x2, vars, min, max, k) - this.integral(x1, vars, min, max, k)) / (x2 - x1);
  }

  private _antiderivative(T: number, r: ZabranskySplineRange): number {
    const theta = T / 100;
    return 100 * theta * (r.a1 + r.a2 * theta / 2 + r.a3 * theta * theta / 3 + r.a4 * Math.pow(theta, 3) / 4);
  }
}
