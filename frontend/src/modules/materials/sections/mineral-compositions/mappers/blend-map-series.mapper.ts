import type { ScatterSeries } from '../../../../../components/charts';
import { MIX_OPTION_LABELS } from '../constants/mix-option-labels.constants';
import type { BlendResult } from '../types/blend-result.type';
import type { PsdMethod } from '../types/psd-method.type';
import { toBlendResultId } from './blend-result-id.mapper';

/** One bubble series per PSD method: x = water %, y = packing efficiency, z = green porosity %. */
export function toBlendMapSeries(results: BlendResult[]): ScatterSeries[] {
  const byMethod = new Map<string, ScatterSeries['data']>();
  for (const result of results) {
    const data = byMethod.get(result.method) ?? [];
    data.push({
      id: toBlendResultId(result),
      x: result.waterDemand_percent,
      y: result.packingEfficiency,
      z: result.porosity_percent_green,
      label: `#${result.rank} · q ${result.q} · ${result.packingModel} · ${result.scenario}`,
    });
    byMethod.set(result.method, data);
  }
  return [...byMethod.entries()].map(([method, data]) => ({
    name: MIX_OPTION_LABELS.psdMethod[method as PsdMethod] ?? method,
    data,
  }));
}
