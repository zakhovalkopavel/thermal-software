import { Equation } from '../../interfaces/equation.interface';
import { YawsLiquidConductivityEquation } from '../../type/yaws-liquid-conductivity-equation';
import { Common } from '../common';
import { gaussLegendre20 } from '../../../utils/quadrature';
import { integrationOrigin } from './integration-origin.util';

/**
 * Yaws 1999 liquid thermal conductivity: log₁₀(k) = a + b (1 − T/c)^(2/7), k in W/(m·K).
 */
export class YawsLiquidConductivityEquationMethod implements Equation<YawsLiquidConductivityEquation> {
  calculate(x: number, vars: YawsLiquidConductivityEquation, min: number, max: number, k = 1): number {
    x = Common.validInterval(x, min, max);
    const { a, b, c } = vars;
    const arg = 1 - x / c;
    if (arg < 0) {
      // Outside the physical branch; clamp at the boundary value.
      return Math.pow(10, a) * k;
    }
    return Math.pow(10, a + b * Math.pow(arg, 2 / 7)) * k;
  }

  integral(x: number, vars: YawsLiquidConductivityEquation, min: number, max: number, k = 1): number {
    x = Common.validInterval(x, min, max);
    return gaussLegendre20(t => this.calculate(t, vars, min, max, k), integrationOrigin(min), x);
  }

  calculateAverage(x1: number, x2: number, vars: YawsLiquidConductivityEquation, min: number, max: number, k = 1): number {
    x1 = Common.validInterval(x1, min, max);
    x2 = Common.validInterval(x2, min, max);
    if (Math.abs(x2 - x1) < 1e-10) return this.calculate(x1, vars, min, max, k);
    return gaussLegendre20(t => this.calculate(t, vars, min, max, k), x1, x2) / (x2 - x1);
  }
}
