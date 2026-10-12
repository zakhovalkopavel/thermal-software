import { Equation } from '../../interfaces/equation.interface';
import { DipprN114Equation } from '../../type/dippr-n114-equation';
import { Common } from '../common';

/**
 * DIPPR Correlation 114 method (liquid heat capacity).
 * Common refs: Perry8, DIPPR_Doc; chemicals EQ114
 *
 * f(T) = c1²/τ + c2 − 2·c1·c3·τ − c1·c4·τ² − c3²·τ³/3 − c3·c4·τ⁴/2 − c4²·τ⁵/5,  τ = 1 − T/Tc
 *
 * Diverges at Tc: throws RangeError when τ ≤ 0 after clamping.
 */
export class DipprEquation114Method implements Equation<DipprN114Equation> {
  calculate(x: number, vars: DipprN114Equation, min: number, max: number, k = 1): number {
    x = Common.validInterval(x, min, max);
    const t = this._tau(x, vars);
    const { c1, c2, c3, c4 } = vars;
    return (c1 * c1 / t + c2 - 2 * c1 * c3 * t - c1 * c4 * t * t - c3 * c3 * Math.pow(t, 3) / 3
            - c3 * c4 * Math.pow(t, 4) / 2 - c4 * c4 * Math.pow(t, 5) / 5) * k;
  }

  /** ∫f dT = −Tc·[c1²·ln τ + c2·τ − c1·c3·τ² − c1·c4·τ³/3 − c3²·τ⁴/12 − c3·c4·τ⁵/10 − c4²·τ⁶/30] */
  integral(x: number, vars: DipprN114Equation, min: number, max: number, k = 1): number {
    x = Common.validInterval(x, min, max);
    const t = this._tau(x, vars);
    const { Tc, c1, c2, c3, c4 } = vars;
    return -Tc * (c1 * c1 * Math.log(t) + c2 * t - c1 * c3 * t * t - c1 * c4 * Math.pow(t, 3) / 3
                  - c3 * c3 * Math.pow(t, 4) / 12 - c3 * c4 * Math.pow(t, 5) / 10
                  - c4 * c4 * Math.pow(t, 6) / 30) * k;
  }

  calculateAverage(x1: number, x2: number, vars: DipprN114Equation, min: number, max: number, k = 1): number {
    x1 = Common.validInterval(x1, min, max);
    x2 = Common.validInterval(x2, min, max);
    if (Math.abs(x2 - x1) < 1e-10) return this.calculate(x1, vars, min, max, k);
    return (this.integral(x2, vars, min, max, k) - this.integral(x1, vars, min, max, k)) / (x2 - x1);
  }

  private _tau(x: number, vars: DipprN114Equation): number {
    const t = 1 - x / vars.Tc;
    if (t <= 0) throw new RangeError(`dipprN114 diverges at T ≥ Tc (${x} ≥ ${vars.Tc})`);
    return t;
  }
}
