import { Equation } from '../../interfaces/equation.interface';
import { YawsLiquidViscosityEquation } from '../../type/yaws-liquid-viscosity-equation';
import { Common } from '../common';
import { gaussLegendre20 } from '../../../utils/quadrature';
import { integrationOrigin } from './integration-origin.util';

/**
 * Yaws 1999 liquid viscosity: log₁₀(μ/cP) = a + b/T + c T + d T².
 * Apply k for cP → Pa·s (typically 1e-3).
 */
export class YawsLiquidViscosityEquationMethod implements Equation<YawsLiquidViscosityEquation> {
  calculate(x: number, vars: YawsLiquidViscosityEquation, min: number, max: number, k = 1): number {
    x = Common.validInterval(x, min, max);
    const { a, b, c, d } = vars;
    const log10Mu = a + b / x + c * x + d * x * x;
    return Math.pow(10, log10Mu) * k;
  }

  integral(x: number, vars: YawsLiquidViscosityEquation, min: number, max: number, k = 1): number {
    x = Common.validInterval(x, min, max);
    return gaussLegendre20(t => this.calculate(t, vars, min, max, k), integrationOrigin(min), x);
  }

  calculateAverage(x1: number, x2: number, vars: YawsLiquidViscosityEquation, min: number, max: number, k = 1): number {
    x1 = Common.validInterval(x1, min, max);
    x2 = Common.validInterval(x2, min, max);
    if (Math.abs(x2 - x1) < 1e-10) return this.calculate(x1, vars, min, max, k);
    return gaussLegendre20(t => this.calculate(t, vars, min, max, k), x1, x2) / (x2 - x1);
  }
}
