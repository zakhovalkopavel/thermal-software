import { Equation } from '../../interfaces/equation.interface';
import { Ppds10Equation } from '../../type/ppds10-equation';
import { Common } from '../common';

/**
 * VDI PPDS 10 saturated liquid density method.
 * Common refs: VDI2010; chemicals volume_VDI_PPDS
 *
 * ρ = ρc + a·τ^0.35 + b·τ^(2/3) + c·τ + d·τ^(4/3),  τ = max(0, 1 − T/Tc)  (ρc above Tc)
 */
export class Ppds10EquationMethod implements Equation<Ppds10Equation> {
  calculate(x: number, vars: Ppds10Equation, min: number, max: number, k = 1): number {
    x = Common.validInterval(x, min, max);
    const t = Math.max(0, 1 - x / vars.Tc);
    const { rhoc, a, b, c, d } = vars;
    return (rhoc + a * Math.pow(t, 0.35) + b * Math.pow(t, 2 / 3) + c * t + d * Math.pow(t, 4 / 3)) * k;
  }

  /** ∫ρ dT = ρc·T − Tc·[a·τ^1.35/1.35 + 3·b·τ^(5/3)/5 + c·τ²/2 + 3·d·τ^(7/3)/7] */
  integral(x: number, vars: Ppds10Equation, min: number, max: number, k = 1): number {
    x = Common.validInterval(x, min, max);
    const t = Math.max(0, 1 - x / vars.Tc);
    const { Tc, rhoc, a, b, c, d } = vars;
    return (rhoc * x - Tc * (a * Math.pow(t, 1.35) / 1.35 + 3 * b * Math.pow(t, 5 / 3) / 5 + c * t * t / 2
                             + 3 * d * Math.pow(t, 7 / 3) / 7)) * k;
  }

  calculateAverage(x1: number, x2: number, vars: Ppds10Equation, min: number, max: number, k = 1): number {
    x1 = Common.validInterval(x1, min, max);
    x2 = Common.validInterval(x2, min, max);
    if (Math.abs(x2 - x1) < 1e-10) return this.calculate(x1, vars, min, max, k);
    return (this.integral(x2, vars, min, max, k) - this.integral(x1, vars, min, max, k)) / (x2 - x1);
  }
}
