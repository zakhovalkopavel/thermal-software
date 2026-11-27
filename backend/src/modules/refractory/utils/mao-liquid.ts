import { celsiusToKelvin } from '../../../common/thermal/utils/temperature/celsius-to-kelvin.util';
import type { MaoOxideGEntry } from '../types/mao-oxide-g-entry.type';
import { AbdulExpression } from './abdul-expression';
import { MaoLiquidDataset } from './mao-liquid-dataset';

const CAS_COMPONENTS = new Set(['CaO', 'Al2O3', 'SiO2']);

/**
 * Mao 2006 ionic CAS liquid helpers: coverage check and oxideG − HSER evaluation
 * from staging `expressionRaw` polynomials. Full ionic speciation is not implemented.
 */
export class MaoLiquid {
  /** True when CaO, Al2O3 and SiO2 are all present and other oxides ≤ maxOther_wt. */
  static coversCas(composition: Record<string, number>, maxOther_wt = 5): boolean {
    for (const key of CAS_COMPONENTS) {
      if ((composition[key] ?? 0) <= 0) return false;
    }
    let other = 0;
    for (const [key, value] of Object.entries(composition)) {
      if (value <= 0) continue;
      if (!CAS_COMPONENTS.has(key)) other += value;
    }
    return other <= maxOther_wt;
  }

  static oxideGEntry(oxide: string): MaoOxideGEntry | undefined {
    return MaoLiquidDataset.load().phases.liquid_ionic_CAS.oxideG[oxide];
  }

  /** G − HSER [J/mol] for a liquid oxide end-member at T [°C]. */
  static oxideGibbs_Jmol(oxide: string, temperature_C: number): number {
    const entry = MaoLiquid.oxideGEntry(oxide);
    if (!entry) throw new Error(`Mao oxideG has no entry for ${oxide}`);
    const T_K = celsiusToKelvin(temperature_C);
    const range = entry.ranges.find(r => T_K >= r.Tmin_K && T_K <= r.Tmax_K)
      ?? entry.ranges.find(r => T_K >= r.Tmin_K)
      ?? entry.ranges[entry.ranges.length - 1];
    if (!range?.expressionRaw) throw new Error(`Mao oxideG for ${oxide} has no expression at ${T_K} K`);
    return MaoLiquid.evaluatePolynomial(range.expressionRaw, T_K);
  }

  static endmemberCount(): number {
    return MaoLiquidDataset.load().phases.liquid_ionic_CAS.endmembers.length;
  }

  static interactionCount(): number {
    return MaoLiquidDataset.load().phases.liquid_ionic_CAS.interactions.length;
  }

  /**
   * Normalises Mao `expressionRaw` into Abdul-style arithmetic (`LN`, `**`) and evaluates it.
   * Example: `-a + bT - cT ln T - dT2 + e * 10-5T3 + fT-1`
   */
  private static evaluatePolynomial(expressionRaw: string, T_K: number): number {
    let s = expressionRaw.replace(/\s+/g, ' ').trim();
    s = s.replace(/(\d)\s*\*\s*10-(\d+)/g, '$1*10**(-$2)');
    s = s.replace(/(\d)\s*\*\s*10\+(\d+)/g, '$1*10**($2)');
    s = s.replace(/T\s*ln\s*T/gi, '(T*LN(T))');
    s = s.replace(/ln\s*T/gi, 'LN(T)');
    s = s.replace(/T-1/g, '(T**(-1))');
    s = s.replace(/T3/g, '(T**3)');
    s = s.replace(/T2/g, '(T**2)');
    // Implicit multiplication: `405.559491T` → `405.559491*T`
    s = s.replace(/(\d(?:\.\d+)?(?:[Ee][+-]?\d+)?)T\b/g, '$1*T');
    // `52.17(T*LN(T))` / `10**(-7)(T**3)` → insert `*`
    s = s.replace(/(\d|\))(\()/g, '$1*$2');
    return AbdulExpression.evaluate(s, T_K, {});
  }
}
