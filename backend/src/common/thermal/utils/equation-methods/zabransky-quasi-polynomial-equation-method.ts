import { Equation } from '../../interfaces/equation.interface';
import { ZabranskyQuasiPolynomialEquation } from '../../type/zabransky-quasi-polynomial-equation';
import { Common } from '../common';

/**
 * Zabransky quasi-polynomial liquid heat capacity method; returns Cp/R (the dataset sets k = R).
 * Common refs: Zabransky1996; chemicals Zabransky_quasi_polynomial, Zabransky_quasi_polynomial_integral
 *
 * Cp/R = a1·ln(1 − Tr) + a2/(1 − Tr) + a3 + a4·Tr + a5·Tr² + a6·Tr³,  Tr = T/Tc
 *
 * Diverges at Tc: throws RangeError when T ≥ Tc after clamping.
 */
export class ZabranskyQuasiPolynomialEquationMethod implements Equation<ZabranskyQuasiPolynomialEquation> {
  calculate(x: number, vars: ZabranskyQuasiPolynomialEquation, min: number, max: number, k = 1): number {
    x = Common.validInterval(x, min, max);
    const t = this._tau(x, vars);
    const { Tc, a1, a2, a3, a4, a5, a6 } = vars;
    const Tr = x / Tc;
    return (a1 * Math.log(t) + a2 / t + a3 + a4 * Tr + a5 * Tr * Tr + a6 * Math.pow(Tr, 3)) * k;
  }

  /**
   * ∫f dT = T·(a3 − a1) + a4·T²/(2·Tc) + a5·T³/(3·Tc²) + a6·T⁴/(4·Tc³)
   *         + a1·T·ln(1 − T/Tc) − Tc·(a1 + a2)·ln(Tc − T)
   */
  integral(x: number, vars: ZabranskyQuasiPolynomialEquation, min: number, max: number, k = 1): number {
    x = Common.validInterval(x, min, max);
    const t = this._tau(x, vars);
    const { Tc, a1, a2, a3, a4, a5, a6 } = vars;
    return (x * (a3 - a1) + a4 * x * x / (2 * Tc) + a5 * Math.pow(x, 3) / (3 * Tc * Tc)
            + a6 * Math.pow(x, 4) / (4 * Math.pow(Tc, 3)) + a1 * x * Math.log(t)
            - Tc * (a1 + a2) * Math.log(Tc - x)) * k;
  }

  calculateAverage(
    x1: number, x2: number, vars: ZabranskyQuasiPolynomialEquation, min: number, max: number, k = 1,
  ): number {
    x1 = Common.validInterval(x1, min, max);
    x2 = Common.validInterval(x2, min, max);
    if (Math.abs(x2 - x1) < 1e-10) return this.calculate(x1, vars, min, max, k);
    return (this.integral(x2, vars, min, max, k) - this.integral(x1, vars, min, max, k)) / (x2 - x1);
  }

  private _tau(x: number, vars: ZabranskyQuasiPolynomialEquation): number {
    const t = 1 - x / vars.Tc;
    if (t <= 0) throw new RangeError(`zabranskyQuasiPolynomial diverges at T ≥ Tc (${x} ≥ ${vars.Tc})`);
    return t;
  }
}
