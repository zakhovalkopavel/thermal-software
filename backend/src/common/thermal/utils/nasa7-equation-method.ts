import { Equation } from '../interfaces/equation.interface';
import { Nasa7Equation } from '../type/nasa7-equation';
import { Common } from './common';

/**
 * NASA 7-coefficient polynomial method.
 *
 * All four thermodynamic quantities (Cp, H, S, G) use the SAME set of 7 coefficients
 * [a1…a5, a6, a7] — this is correct by design and is a fundamental property of the
 * NASA polynomial format (Gordon & McBride 1994, NASA RP-1311).
 *
 * The coefficients are derived from a single least-squares fit of Cp/R vs T.
 * H and S are then obtained analytically by integrating Cp/R:
 *
 *   Cp/R = a1 + a2·T + a3·T² + a4·T³ + a5·T⁴
 *   H/RT = a1 + a2·T/2 + a3·T²/3 + a4·T³/4 + a5·T⁴/5 + a6/T   ← a6 is integration constant
 *   S/R  = a1·lnT + a2·T + a3·T²/2 + a4·T³/3 + a5·T⁴/4 + a7   ← a7 is integration constant
 *   G/RT = H/RT − S/R
 *
 * a6 encodes the reference enthalpy (Hf° at 298 K).
 * a7 encodes the reference entropy.
 * Each temperature range (low/high) has its own 7-coefficient set.
 */
export class Nasa7EquationMethod implements Equation<Nasa7Equation> {
  private _coeffs(T: number, vars: Nasa7Equation): [number, number, number, number, number, number, number] {
    return T < vars.Tswitch ? vars.low : vars.high;
  }

  /**
   * Cp [J/(mol·K)]
   * Cp/R = a1 + a2·T + a3·T² + a4·T³ + a5·T⁴
   */
  calculate(T: number, vars: Nasa7Equation, min: number, max: number, k = 1): number {
    T = Math.min(Math.max(T, min), max);
    const [a1, a2, a3, a4, a5] = this._coeffs(T, vars);
    return (a1 + a2 * T + a3 * T * T + a4 * T * T * T + a5 * T * T * T * T) * Common.R * k;
  }

  integral(T: number, vars: Nasa7Equation, min: number, max: number, k = 1): number {
    T = Math.min(Math.max(T, min), max);
    const [a1, a2, a3, a4, a5] = this._coeffs(T, vars);
    return (a1 * T + a2 * T * T / 2 + a3 * Math.pow(T, 3) / 3 +
            a4 * Math.pow(T, 4) / 4 + a5 * Math.pow(T, 5) / 5) * Common.R * k;
  }

  calculateAverage(T1: number, T2: number, vars: Nasa7Equation, min: number, max: number, k = 1): number {
    T1 = Math.min(Math.max(T1, min), max);
    T2 = Math.min(Math.max(T2, min), max);
    if (Math.abs(T2 - T1) < 1e-10) return this.calculate(T1, vars, min, max, k);
    const ts = vars.Tswitch;
    if (T1 < ts && T2 >= ts) {
      const iLow  = this._integralSet(ts,  vars.low)  - this._integralSet(T1, vars.low);
      const iHigh = this._integralSet(T2,  vars.high) - this._integralSet(ts, vars.high);
      return (iLow + iHigh) * Common.R * k / (T2 - T1);
    }
    return (this.integral(T2, vars, min, max, k) - this.integral(T1, vars, min, max, k)) / (T2 - T1);
  }

  private _integralSet(T: number, a: [number,number,number,number,number,number,number]): number {
    return a[0]*T + a[1]*T*T/2 + a[2]*Math.pow(T,3)/3 + a[3]*Math.pow(T,4)/4 + a[4]*Math.pow(T,5)/5;
  }

  /**
   * Molar enthalpy H [J/mol]
   * H/RT = a1 + a2·T/2 + a3·T²/3 + a4·T³/4 + a5·T⁴/5 + a6/T
   */
  enthalpy(T: number, vars: Nasa7Equation): number {
    const [a1, a2, a3, a4, a5, a6] = this._coeffs(T, vars);
    const H_RT = a1 + a2*T/2 + a3*T*T/3 + a4*T*T*T/4 + a5*T*T*T*T/5 + a6/T;
    return H_RT * Common.R * T;
  }

  /**
   * Molar entropy S [J/(mol·K)]
   * S/R = a1·ln T + a2·T + a3·T²/2 + a4·T³/3 + a5·T⁴/4 + a7
   */
  entropy(T: number, vars: Nasa7Equation): number {
    const [a1, a2, a3, a4, a5, , a7] = this._coeffs(T, vars);
    const S_R = a1*Math.log(T) + a2*T + a3*T*T/2 + a4*T*T*T/3 + a5*T*T*T*T/4 + a7;
    return S_R * Common.R;
  }

  /** Molar Gibbs free energy G = H − T·S [J/mol] */
  gibbsEnergy(T: number, vars: Nasa7Equation): number {
    return this.enthalpy(T, vars) - T * this.entropy(T, vars);
  }
}
