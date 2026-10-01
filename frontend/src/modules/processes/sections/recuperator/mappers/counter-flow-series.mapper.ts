import type { XYSeries } from '@/shared/ui/charts';
import type { RecuperatorInput } from '../types/recuperator-input.type';
import type { RecuperatorResult } from '../types/recuperator-result.type';

/** Smoke enters at x = 0, air at x = L; only the end temperatures are returned, so each line is one straight segment. */
export function toCounterFlowSeries(input: RecuperatorInput, result: RecuperatorResult): XYSeries[] {
  const length = result.recuperatorLength_m;
  return [
    { name: 'Smoke', unit: 'K', showMarkers: true, data: [[0, result.tSmokeStart_K], [length, result.tSmokeEnd_K]] },
    { name: 'Air', unit: 'K', showMarkers: true, data: [[0, result.tAirEnd_K], [length, input.tAirStart_K]] },
  ];
}
