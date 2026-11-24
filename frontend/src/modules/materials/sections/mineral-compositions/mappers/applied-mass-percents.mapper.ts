import { MINERAL_COMPOSITIONS_UI } from '../constants/mineral-compositions-ui.constants';
import type { BlendResult } from '../types/blend-result.type';

/** Result mass fractions keyed by the mix fraction ids they were requested for. */
export function toAppliedMassPercents(result: BlendResult, fractionIds: string[]): Record<string, number> {
  return Object.fromEntries(
    fractionIds.map((id, index) => [id, result.massFractions[index] * MINERAL_COMPOSITIONS_UI.massPercentTotal]),
  );
}
