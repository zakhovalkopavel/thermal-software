import { Equation } from '../interfaces/equation.interface';
import { Nasa7Equation, Nasa7Coeffs } from '../type/nasa7-equation';
import { Common } from './common';

/**
 * NASA 7-coefficient polynomial method.
 * Common refs: NASA7, Burcat2005
 *
 * Covers Cp, H, S, G for two temperature ranges (low/high) split at Tswitch.
 * All four properties use the same [a1…a7] per range — a6 fixes Hf°, a7 fixes S°.
 */
export class Nasa7EquationMethod implements Equation<Nasa7Equation> {
  private _coeffs(T: number, vars: Nasa7Equation): Nasa7Coeffs {
    return T < vars.Tswitch ? vars.low : vars.high;
  }

  /**
   * Isobaric molar heat capacity Cp [J/(mol·K)].
   *
   * Cp/R = a1 + a2·T + a3·T² + a4·T³ + a5·T⁴
   */
  calculate(T: number, vars: Nasa7Equation, min: number, max: number, k = 1): number {
    T = Common.validInterval(T, min, max);
    const { a1, a2, a3, a4, a5 } = this._coeffs(T, vars);
    return (a1 + a2*T + a3*T*T + a4*T*T*T + a5*T*T*T*T) * Common.R * k;
  }

  /**
   * Antiderivative of Cp (exact, polynomial).
   * ∫Cp dT = R·(a1·T + a2·T²/2 + a3·T³/3 + a4·T⁴/4 + a5·T⁵/5)
   */
  integral(T: number, vars: Nasa7Equation, min: number, max: number, k = 1): number {
    T = Common.validInterval(T, min, max);
    const { a1, a2, a3, a4, a5 } = this._coeffs(T, vars);
    return (a1*T + a2*T*T/2 + a3*Math.pow(T,3)/3 +
            a4*Math.pow(T,4)/4 + a5*Math.pow(T,5)/5) * Common.R * k;
  }

  calculateAverage(T1: number, T2: number, vars: Nasa7Equation, min: number, max: number, k = 1): number {
    T1 = Common.validInterval(T1, min, max);
    T2 = Common.validInterval(T2, min, max);
    if (Math.abs(T2 - T1) < 1e-10) return this.calculate(T1, vars, min, max, k);
    const ts = vars.Tswitch;
    if (T1 < ts && T2 >= ts) {
      const iLow  = this._integralCoeffs(ts,  vars.low)  - this._integralCoeffs(T1, vars.low);
      const iHigh = this._integralCoeffs(T2,  vars.high) - this._integralCoeffs(ts, vars.high);
      return (iLow + iHigh) * Common.R * k / (T2 - T1);
    }
    return (this.integral(T2, vars, min, max, k) - this.integral(T1, vars, min, max, k)) / (T2 - T1);
  }

  private _integralCoeffs(T: number, c: Nasa7Coeffs): number {
    return c.a1*T + c.a2*T*T/2 + c.a3*Math.pow(T,3)/3 + c.a4*Math.pow(T,4)/4 + c.a5*Math.pow(T,5)/5;
  }

  /**
   * Molar enthalpy H [J/mol].
   * H/RT = a1 + a2·T/2 + a3·T²/3 + a4·T³/4 + a5·T⁴/5 + a6/T
   * a6 is the integration constant fixing Hf° at 298 K.
   */
  enthalpy(T: number, vars: Nasa7Equation): number {
    const { a1, a2, a3, a4, a5, a6 } = this._coeffs(T, vars);
    return (a1 + a2*T/2 + a3*T*T/3 + a4*T*T*T/4 + a5*T*T*T*T/5 + a6/T) * Common.R * T;
  }

  /**
   * Molar entropy S [J/(mol·K)].
   * S/R = a1·ln T + a2·T + a3·T²/2 + a4·T³/3 + a5·T⁴/4 + a7
   * a7 is the integration constant fixing S° at 298 K.
   */
  entropy(T: number, vars: Nasa7Equation): number {
    const { a1, a2, a3, a4, a5, a7 } = this._coeffs(T, vars);
    return (a1*Math.log(T) + a2*T + a3*T*T/2 + a4*T*T*T/3 + a5*T*T*T*T/4 + a7) * Common.R;
  }

  /**
   * Molar Gibbs free energy G = H − T·S [J/mol].
   */
  gibbsEnergy(T: number, vars: Nasa7Equation): number {
    return this.enthalpy(T, vars) - T * this.entropy(T, vars);
  }
}

