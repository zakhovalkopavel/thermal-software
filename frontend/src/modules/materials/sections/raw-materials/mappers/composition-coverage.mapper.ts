import type { MixCompositionResult } from '../../../types/mix-composition-result.type';

/** Share of the fired mass represented by the accepted oxides, %. */
export function toCompositionCoverage(result: MixCompositionResult): number {
  return Object.values(result.acceptedOxides_wt).reduce<number>((sum, value) => sum + (value ?? 0), 0);
}
