import { KCT56_CONDUCTIVITY_MODEL } from '../data/kct56-conductivity.data';
import { Kct56ConductivityModel } from '../types/kct56-conductivity-model.type';

/**
 * Closed-form carbon-steel thermal conductivity λ(C,T) via Chebyshev F(C,T).
 * Stateless — coefficients from {@link KCT56_CONDUCTIVITY_MODEL}.
 */
export class Kct56Conductivity {
  /** λ [W/(m·K)] at carbon C [wt%] and temperature T_C [°C]. */
  static evaluate(C_wtPct: number, T_C: number): number {
    const model = KCT56_CONDUCTIVITY_MODEL;
    Kct56Conductivity.assertInDomain(C_wtPct, T_C, model);
    const cn = Kct56Conductivity.norm(C_wtPct, model.C_min, model.C_max);
    const tn = Kct56Conductivity.norm(T_C, model.T_C_min, model.T_C_max);
    let sum = 0;
    const stride = model.degT + 1;
    for (let i = 0; i <= model.degC; i++) {
      const ti = Kct56Conductivity.chebyshev(i, cn);
      for (let j = 0; j <= model.degT; j++) {
        sum += model.coef[i * stride + j] * ti * Kct56Conductivity.chebyshev(j, tn);
      }
    }
    return sum;
  }

  /** λ [W/(m·K)] at C [wt%] and T_K [K]. */
  static evaluateKelvin(C_wtPct: number, T_K: number): number {
    return Kct56Conductivity.evaluate(C_wtPct, T_K - 273.15);
  }

  static isInDomain(C_wtPct: number, T_C: number): boolean {
    const m = KCT56_CONDUCTIVITY_MODEL;
    return (
      C_wtPct >= m.C_min
      && C_wtPct <= m.C_max
      && T_C >= m.T_C_min
      && T_C <= m.T_C_max
    );
  }

  private static assertInDomain(
    C_wtPct: number,
    T_C: number,
    model: Kct56ConductivityModel,
  ): void {
    if (!Number.isFinite(C_wtPct) || !Number.isFinite(T_C)) {
      throw new Error('kCT56 requires finite C [wt%] and T [°C]');
    }
    if (C_wtPct < model.C_min || C_wtPct > model.C_max) {
      throw new Error(
        `kCT56 C=${C_wtPct} wt% outside [${model.C_min}, ${model.C_max}]`,
      );
    }
    if (T_C < model.T_C_min || T_C > model.T_C_max) {
      throw new Error(
        `kCT56 T=${T_C} °C outside [${model.T_C_min}, ${model.T_C_max}]`,
      );
    }
  }

  private static norm(x: number, lo: number, hi: number): number {
    return hi > lo ? (2 * (x - lo)) / (hi - lo) - 1 : 0;
  }

  private static chebyshev(n: number, x: number): number {
    if (n === 0) return 1;
    if (n === 1) return x;
    let a = 1;
    let b = x;
    for (let k = 2; k <= n; k++) {
      const next = 2 * x * b - a;
      a = b;
      b = next;
    }
    return b;
  }
}
