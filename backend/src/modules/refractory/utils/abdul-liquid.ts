import { celsiusToKelvin } from '../../../common/thermal/utils/temperature/celsius-to-kelvin.util';
import type { AbdulLiquidParameter } from '../types/abdul-liquid-parameter.type';
import { AbdulExpression } from './abdul-expression';
import { AbdulLiquidDataset } from './abdul-liquid-dataset';

const CAS_COMPONENTS = new Set(['CaO', 'Al2O3', 'SiO2']);

/**
 * Abdul 2023 associate-liquid helpers: detect CAS coverage and evaluate
 * liquid end-member / excess L expressions from staging `functions`.
 */
export class AbdulLiquid {
  /** True when CaO, Al2O3 and SiO2 are all present and other oxides ≤ maxOther_wt. */
  static coversCas(composition: Record<string, number>, maxOther_wt = 5): boolean {
    if (CAS_COMPONENTS.size !== 3) return false;
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

  /** G [J/mol] for one liquid PARAMETER expression at T [°C]. */
  static evaluateParameter(row: AbdulLiquidParameter, temperature_C: number): number {
    const data = AbdulLiquidDataset.load();
    const T_K = celsiusToKelvin(temperature_C);
    return AbdulExpression.evaluate(row.expression, T_K, data.functions);
  }

  /** End-member liquid G rows from the staging file. */
  static endmemberParameters(): AbdulLiquidParameter[] {
    return AbdulLiquidDataset.load().liquid.endmemberG;
  }

  /** Excess L rows from the staging file. */
  static excessParameters(): AbdulLiquidParameter[] {
    return AbdulLiquidDataset.load().liquid.excessL;
  }
}
