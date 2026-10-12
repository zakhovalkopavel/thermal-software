import { Equation } from '../../interfaces/equation.interface';
import { Ppds9Equation } from '../../type/ppds9-equation';
import { Common } from '../common';
import { gaussLegendre20 } from '../../../utils/quadrature';
import { integrationOrigin } from './integration-origin.util';

/**
 * VDI PPDS 9 liquid viscosity method.
 * Common refs: VDI2010; chemicals PPDS9
 *
 * μ = e·exp(a·s^(1/3) + b·s^(4/3)),  s = (c − T)/(T − d)
 *
 * s^(1/3) is the real cube root (s < 0 above T = c). Singular at T = d.
 */
export class Ppds9EquationMethod implements Equation<Ppds9Equation> {
  calculate(x: number, vars: Ppds9Equation, min: number, max: number, k = 1): number {
    x = Common.validInterval(x, min, max);
    const { a, b, c, d, e } = vars;
    const s = (c - x) / (x - d);
    const root = Math.cbrt(s);
    return e * Math.exp(a * root + b * s * root) * k;
  }

  /** Numerical integral via 20-point Gauss–Legendre quadrature; no closed form exists. */
  integral(x: number, vars: Ppds9Equation, min: number, max: number, k = 1): number {
    x = Common.validInterval(x, min, max);
    return gaussLegendre20(t => this.calculate(t, vars, min, max, k), integrationOrigin(min), x);
  }

  calculateAverage(x1: number, x2: number, vars: Ppds9Equation, min: number, max: number, k = 1): number {
    x1 = Common.validInterval(x1, min, max);
    x2 = Common.validInterval(x2, min, max);
    if (Math.abs(x2 - x1) < 1e-10) return this.calculate(x1, vars, min, max, k);
    return gaussLegendre20(t => this.calculate(t, vars, min, max, k), x1, x2) / (x2 - x1);
  }
}
