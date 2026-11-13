import { Equation } from '../../interfaces/equation.interface';
import { YawsWaterSolubilityEquation } from '../../type/yaws-water-solubility-equation';
import { Common } from '../common';
import { gaussLegendre20 } from '../../../utils/quadrature';
import { integrationOrigin } from './integration-origin.util';

/**
 * Yaws 1999 water solubility: log₁₀(S/ppm wt) = a + b/T + c/T².
 * Apply k for ppm wt → mass fraction (typically 1e-6).
 */
export class YawsWaterSolubilityEquationMethod implements Equation<YawsWaterSolubilityEquation> {
  calculate(x: number, vars: YawsWaterSolubilityEquation, min: number, max: number, k = 1): number {
    x = Common.validInterval(x, min, max);
    const { a, b, c } = vars;
    const log10S = a + b / x + c / (x * x);
    return Math.pow(10, log10S) * k;
  }

  integral(x: number, vars: YawsWaterSolubilityEquation, min: number, max: number, k = 1): number {
    x = Common.validInterval(x, min, max);
    return gaussLegendre20(t => this.calculate(t, vars, min, max, k), integrationOrigin(min), x);
  }

  calculateAverage(x1: number, x2: number, vars: YawsWaterSolubilityEquation, min: number, max: number, k = 1): number {
    x1 = Common.validInterval(x1, min, max);
    x2 = Common.validInterval(x2, min, max);
    if (Math.abs(x2 - x1) < 1e-10) return this.calculate(x1, vars, min, max, k);
    return gaussLegendre20(t => this.calculate(t, vars, min, max, k), x1, x2) / (x2 - x1);
  }
}
