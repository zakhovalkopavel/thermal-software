import { Equation } from '../../interfaces/equation.interface';
import { YawsVaporPressureEquation } from '../../type/yaws-vapor-pressure-equation';
import { Common } from '../common';
import { gaussLegendre20 } from '../../../utils/quadrature';
import { integrationOrigin } from './integration-origin.util';

/**
 * Yaws 1999 vapor pressure: log₁₀(P/mmHg) = a + b/T + c log₁₀(T) + d T + e T².
 * Apply k for mmHg → Pa (typically 133.322387415).
 */
export class YawsVaporPressureEquationMethod implements Equation<YawsVaporPressureEquation> {
  calculate(x: number, vars: YawsVaporPressureEquation, min: number, max: number, k = 1): number {
    x = Common.validInterval(x, min, max);
    const { a, b, c, d, e } = vars;
    const log10P = a + b / x + c * Math.log10(x) + d * x + e * x * x;
    return Math.pow(10, log10P) * k;
  }

  integral(x: number, vars: YawsVaporPressureEquation, min: number, max: number, k = 1): number {
    x = Common.validInterval(x, min, max);
    return gaussLegendre20(t => this.calculate(t, vars, min, max, k), integrationOrigin(min), x);
  }

  calculateAverage(x1: number, x2: number, vars: YawsVaporPressureEquation, min: number, max: number, k = 1): number {
    x1 = Common.validInterval(x1, min, max);
    x2 = Common.validInterval(x2, min, max);
    if (Math.abs(x2 - x1) < 1e-10) return this.calculate(x1, vars, min, max, k);
    return gaussLegendre20(t => this.calculate(t, vars, min, max, k), x1, x2) / (x2 - x1);
  }
}
