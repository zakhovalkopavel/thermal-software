import { Equation } from '../../interfaces/equation.interface';
import { YawsLiquidDensityEquation } from '../../type/yaws-liquid-density-equation';
import { Common } from '../common';
import { gaussLegendre20 } from '../../../utils/quadrature';
import { integrationOrigin } from './integration-origin.util';

/**
 * Yaws 1999 liquid density: ρ = a · b^(-(1 − T/Tc)^n) in g/ml.
 * Apply k for g/ml → kg/m³ (typically 1000).
 */
export class YawsLiquidDensityEquationMethod implements Equation<YawsLiquidDensityEquation> {
  calculate(x: number, vars: YawsLiquidDensityEquation, min: number, max: number, k = 1): number {
    x = Common.validInterval(x, min, max);
    const { a, b, n, Tc } = vars;
    if (x >= Tc) {
      return a * k;
    }
    const tau = 1 - x / Tc;
    return a * Math.pow(b, -Math.pow(tau, n)) * k;
  }

  integral(x: number, vars: YawsLiquidDensityEquation, min: number, max: number, k = 1): number {
    x = Common.validInterval(x, min, max);
    return gaussLegendre20(t => this.calculate(t, vars, min, max, k), integrationOrigin(min), x);
  }

  calculateAverage(x1: number, x2: number, vars: YawsLiquidDensityEquation, min: number, max: number, k = 1): number {
    x1 = Common.validInterval(x1, min, max);
    x2 = Common.validInterval(x2, min, max);
    if (Math.abs(x2 - x1) < 1e-10) return this.calculate(x1, vars, min, max, k);
    return gaussLegendre20(t => this.calculate(t, vars, min, max, k), x1, x2) / (x2 - x1);
  }
}
