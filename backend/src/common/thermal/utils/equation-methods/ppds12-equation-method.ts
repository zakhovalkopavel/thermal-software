import { Equation } from '../../interfaces/equation.interface';
import { Ppds12Equation } from '../../type/ppds12-equation';
import { Common } from '../common';
import { PHYSICAL_CONSTANTS } from '../../constants/physical.constants';

/**
 * VDI PPDS 12 enthalpy of vaporization method; applies R itself (the dataset sets no k).
 * Common refs: VDI2010; chemicals PPDS12
 *
 * ΔHvap = R·Tc·(a·τ^(1/3) + b·τ^(2/3) + c·τ + d·τ² + e·τ⁶),  τ = max(0, 1 − T/Tc)  (0 above Tc)
 */
export class Ppds12EquationMethod implements Equation<Ppds12Equation> {
  calculate(x: number, vars: Ppds12Equation, min: number, max: number, k = 1): number {
    x = Common.validInterval(x, min, max);
    const t = Math.max(0, 1 - x / vars.Tc);
    const { Tc, a, b, c, d, e } = vars;
    return PHYSICAL_CONSTANTS.GAS_CONSTANT_J_MOLK * Tc
      * (a * Math.cbrt(t) + b * Math.pow(t, 2 / 3) + c * t + d * t * t + e * Math.pow(t, 6)) * k;
  }

  /** ∫ΔHvap dT = −R·Tc²·[3·a·τ^(4/3)/4 + 3·b·τ^(5/3)/5 + c·τ²/2 + d·τ³/3 + e·τ⁷/7] */
  integral(x: number, vars: Ppds12Equation, min: number, max: number, k = 1): number {
    x = Common.validInterval(x, min, max);
    const t = Math.max(0, 1 - x / vars.Tc);
    const { Tc, a, b, c, d, e } = vars;
    return -PHYSICAL_CONSTANTS.GAS_CONSTANT_J_MOLK * Tc * Tc
      * (3 * a * Math.pow(t, 4 / 3) / 4 + 3 * b * Math.pow(t, 5 / 3) / 5 + c * t * t / 2 + d * Math.pow(t, 3) / 3
         + e * Math.pow(t, 7) / 7) * k;
  }

  calculateAverage(x1: number, x2: number, vars: Ppds12Equation, min: number, max: number, k = 1): number {
    x1 = Common.validInterval(x1, min, max);
    x2 = Common.validInterval(x2, min, max);
    if (Math.abs(x2 - x1) < 1e-10) return this.calculate(x1, vars, min, max, k);
    return (this.integral(x2, vars, min, max, k) - this.integral(x1, vars, min, max, k)) / (x2 - x1);
  }
}
