import { Equation } from '../interfaces/equation.interface';
import { Nasa9Equation, Nasa9Coeffs } from '../type/nasa9-equation';
import { Common } from './common';

/**
 * NASA 9-coefficient polynomial method.
 * ref: NASA9 (McBride & Gordon — NASA RP-1311 / NASA TP-2002-211556)
 *
 * Covers Cp, H, S, G for an arbitrary number of contiguous temperature ranges.
 * Each range has its own 9 coefficients {a1…a9}.
 * a8 is the integration constant fixing Hf°; a9 fixes S°.
 *
 * Cp/R = a1·T⁻² + a2·T⁻¹ + a3 + a4·T + a5·T² + a6·T³ + a7·T⁴
 * H/RT = −a1·T⁻² + a2·ln(T)/T + a3 + a4·T/2 + a5·T²/3 + a6·T³/4 + a7·T⁴/5 + a8/T
 * S/R  = −a1·T⁻²/2 − a2·T⁻¹ + a3·ln(T) + a4·T + a5·T²/2 + a6·T³/3 + a7·T⁴/4 + a9
 */
export class Nasa9EquationMethod implements Equation<Nasa9Equation> {
  /** Select the range whose [Tmin, Tmax] bracket contains T (last range wins for T above all ranges). */
  private _coeffs(T: number, vars: Nasa9Equation): Nasa9Coeffs {
    for (const range of vars.ranges) {
      if (T <= range.Tmax) return range.coeffs;
    }
    return vars.ranges[vars.ranges.length - 1].coeffs;
  }

  /**
   * Isobaric molar heat capacity Cp [J/(mol·K)].
   *
   * Cp/R = a1·T⁻² + a2·T⁻¹ + a3 + a4·T + a5·T² + a6·T³ + a7·T⁴
   */
  calculate(T: number, vars: Nasa9Equation, min: number, max: number, k = 1): number {
    T = Common.validInterval(T, min, max);
    const { a1, a2, a3, a4, a5, a6, a7 } = this._coeffs(T, vars);
    return (a1/(T*T) + a2/T + a3 + a4*T + a5*T*T + a6*T*T*T + a7*Math.pow(T,4)) * Common.R * k;
  }

  /**
   * Antiderivative of Cp (exact).
   * ∫Cp dT = R·(−a1/T + a2·ln T + a3·T + a4·T²/2 + a5·T³/3 + a6·T⁴/4 + a7·T⁵/5)
   */
  integral(T: number, vars: Nasa9Equation, min: number, max: number, k = 1): number {
    T = Common.validInterval(T, min, max);
    const { a1, a2, a3, a4, a5, a6, a7 } = this._coeffs(T, vars);
    return (-a1/T + a2*Math.log(T) + a3*T + a4*T*T/2 +
            a5*Math.pow(T,3)/3 + a6*Math.pow(T,4)/4 + a7*Math.pow(T,5)/5) * Common.R * k;
  }

  calculateAverage(T1: number, T2: number, vars: Nasa9Equation, min: number, max: number, k = 1): number {
    T1 = Common.validInterval(T1, min, max);
    T2 = Common.validInterval(T2, min, max);
    if (Math.abs(T2 - T1) < 1e-10) return this.calculate(T1, vars, min, max, k);

    // Collect all range boundaries that fall strictly between T1 and T2
    const breaks = vars.ranges
      .map(r => r.Tmax)
      .filter(t => t > T1 && t < T2);

    const points = [T1, ...breaks, T2];
    let sum = 0;
    for (let i = 0; i < points.length - 1; i++) {
      const lo = points[i];
      const hi = points[i + 1];
      const c = this._coeffs((lo + hi) / 2, vars);
      sum += this._integralAt(hi, c) - this._integralAt(lo, c);
    }
    return sum * Common.R * k / (T2 - T1);
  }

  private _integralAt(T: number, c: Nasa9Coeffs): number {
    return -c.a1/T + c.a2*Math.log(T) + c.a3*T + c.a4*T*T/2 +
           c.a5*Math.pow(T,3)/3 + c.a6*Math.pow(T,4)/4 + c.a7*Math.pow(T,5)/5;
  }

  /**
   * Molar enthalpy H [J/mol].
   * H/RT = −a1·T⁻² + a2·ln(T)/T + a3 + a4·T/2 + a5·T²/3 + a6·T³/4 + a7·T⁴/5 + a8/T
   */
  enthalpy(T: number, vars: Nasa9Equation): number {
    const { a1, a2, a3, a4, a5, a6, a7, a8 } = this._coeffs(T, vars);
    const HoRT = -a1/(T*T) + a2*Math.log(T)/T + a3 + a4*T/2 +
                 a5*T*T/3 + a6*Math.pow(T,3)/4 + a7*Math.pow(T,4)/5 + a8/T;
    return HoRT * Common.R * T;
  }

  /**
   * Molar entropy S [J/(mol·K)].
   * S/R = −a1·T⁻²/2 − a2·T⁻¹ + a3·ln(T) + a4·T + a5·T²/2 + a6·T³/3 + a7·T⁴/4 + a9
   */
  entropy(T: number, vars: Nasa9Equation): number {
    const { a1, a2, a3, a4, a5, a6, a7, a9 } = this._coeffs(T, vars);
    return (-a1/(2*T*T) - a2/T + a3*Math.log(T) + a4*T +
            a5*T*T/2 + a6*Math.pow(T,3)/3 + a7*Math.pow(T,4)/4 + a9) * Common.R;
  }

  /**
   * Molar Gibbs free energy G [J/mol] — direct G/RT polynomial (not computed as H − T·S).
   *
   * G/RT = H/RT − S/R
   *      = −a1/(2T²) − a2·(1 + ln T)/T + a3·(1 − ln T)
   *        − a4·T/2 − a5·T²/6 − a6·T³/12 − a7·T⁴/20 + a8/T − a9
   *
   * Using the direct formula avoids cancellation errors in H − T·S at high T.
   */
  gibbsEnergy(T: number, vars: Nasa9Equation): number {
    const { a1, a2, a3, a4, a5, a6, a7, a8, a9 } = this._coeffs(T, vars);
    const lnT = Math.log(T);
    const GoRT = -a1/(2*T*T) - a2*(1 + lnT)/T + a3*(1 - lnT)
               - a4*T/2 - a5*T*T/6 - a6*Math.pow(T,3)/12 - a7*Math.pow(T,4)/20
               + a8/T - a9;
    return GoRT * Common.R * T;
  }
}

