import { Equation } from '../../interfaces/equation.interface';
import { Wagner25Equation } from '../../type/wagner25-equation';
import { Common } from '../common';
import { gaussLegendre20 } from '../../../utils/quadrature';
import { integrationOrigin } from './integration-origin.util';

/**
 * Wagner 2.5/5 vapour pressure method (VDI PPDS 16).
 * Common refs: VDI2010; chemicals Wagner
 *
 * ln(P) = ln(Pc) + (a·τ + b·τ^1.5 + c·τ^2.5 + d·τ⁵)/Tr,  Tr = min(T/Tc, 1),  τ = 1 − Tr  (Pc above Tc)
 */
export class Wagner25EquationMethod implements Equation<Wagner25Equation> {
  calculate(x: number, vars: Wagner25Equation, min: number, max: number, k = 1): number {
    x = Common.validInterval(x, min, max);
    const { Tc, Pc, a, b, c, d } = vars;
    const Tr = Math.min(x / Tc, 1);
    const t = 1 - Tr;
    return Pc * Math.exp((a * t + b * Math.pow(t, 1.5) + c * Math.pow(t, 2.5) + d * Math.pow(t, 5)) / Tr) * k;
  }

  /** Numerical integral via 20-point Gauss–Legendre quadrature; no closed form exists. */
  integral(x: number, vars: Wagner25Equation, min: number, max: number, k = 1): number {
    x = Common.validInterval(x, min, max);
    return gaussLegendre20(t => this.calculate(t, vars, min, max, k), integrationOrigin(min), x);
  }

  calculateAverage(x1: number, x2: number, vars: Wagner25Equation, min: number, max: number, k = 1): number {
    x1 = Common.validInterval(x1, min, max);
    x2 = Common.validInterval(x2, min, max);
    if (Math.abs(x2 - x1) < 1e-10) return this.calculate(x1, vars, min, max, k);
    return gaussLegendre20(t => this.calculate(t, vars, min, max, k), x1, x2) / (x2 - x1);
  }
}
