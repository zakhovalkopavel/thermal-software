import { Equation } from '../../interfaces/equation.interface';
import { DipprN106Equation } from '../../type/dippr-n106-equation';
import { Common } from '../common';
import { gaussLegendre20 } from '../../../utils/quadrature';
import { integrationOrigin } from './integration-origin.util';

/**
 * DIPPR Correlation 106 method (surface tension).
 * Common refs: VDI2010, DIPPR_Doc; chemicals EQ106
 *
 * σ = c1·τ^(c2 + c3·Tr + c4·Tr² + c5·Tr³),  τ = 1 − Tr,  Tr = T/Tc  (0 at and above Tc)
 */
export class DipprEquation106Method implements Equation<DipprN106Equation> {
  calculate(x: number, vars: DipprN106Equation, min: number, max: number, k = 1): number {
    x = Common.validInterval(x, min, max);
    const { Tc, c1, c2, c3, c4, c5 } = vars;
    const Tr = x / Tc;
    const t = 1 - Tr;
    if (t <= 0) return 0;
    return c1 * Math.pow(t, c2 + c3 * Tr + c4 * Tr * Tr + c5 * Math.pow(Tr, 3)) * k;
  }

  /** Numerical integral via 20-point Gauss–Legendre quadrature; no closed form exists. */
  integral(x: number, vars: DipprN106Equation, min: number, max: number, k = 1): number {
    x = Common.validInterval(x, min, max);
    return gaussLegendre20(t => this.calculate(t, vars, min, max, k), integrationOrigin(min), x);
  }

  calculateAverage(x1: number, x2: number, vars: DipprN106Equation, min: number, max: number, k = 1): number {
    x1 = Common.validInterval(x1, min, max);
    x2 = Common.validInterval(x2, min, max);
    if (Math.abs(x2 - x1) < 1e-10) return this.calculate(x1, vars, min, max, k);
    return gaussLegendre20(t => this.calculate(t, vars, min, max, k), x1, x2) / (x2 - x1);
  }
}
