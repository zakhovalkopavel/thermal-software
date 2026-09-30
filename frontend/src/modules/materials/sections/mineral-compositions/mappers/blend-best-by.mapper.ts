import type { BlendBestBy } from '../types/blend-best-by.type';
import type { BlendResult } from '../types/blend-result.type';
import { toBlendResultId } from './blend-result-id.mapper';

type Criterion = { label: string; read: (result: BlendResult) => number; better: 'min' | 'max'; unit?: string };

const CRITERIA: Criterion[] = [
  { label: 'Score', read: (result) => result.optimizationScore, better: 'max' },
  { label: 'Packing efficiency', read: (result) => result.packingEfficiency, better: 'max' },
  { label: 'Lowest water', read: (result) => result.waterDemand_percent, better: 'min', unit: '%' },
  { label: 'Lowest porosity', read: (result) => result.porosity_percent_green, better: 'min', unit: '%' },
  { label: 'Highest green density', read: (result) => result.rhoBulk_gml_green, better: 'max', unit: 'g/ml' },
];

/** Extremes of the returned results; the optimiser itself does not report best-by picks. */
export function toBlendBestBy(results: BlendResult[]): BlendBestBy[] {
  if (results.length === 0) return [];
  return CRITERIA.map(({ label, read, better, unit }) => {
    const best = results.reduce((winner, result) =>
      (better === 'max' ? read(result) > read(winner) : read(result) < read(winner)) ? result : winner,
    );
    return { label, id: toBlendResultId(best), value: read(best), unit };
  });
}
