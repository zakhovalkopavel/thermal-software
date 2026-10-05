import { MIX_COMPOSITION_CONSTANTS } from '../constants/mix-composition.constants';

/**
 * Phase composition of a raw material after firing: loss on ignition and metal
 * impurities below the threshold removed, every other key kept as a phase
 * (SiC stays SiC, TiN stays TiN) and rescaled to Σ = 100 wt%.
 */
export function toFiredPhases(composition: Record<string, number>): {
  phases_wt: Record<string, number>;
  lossOnIgnition_wt: number;
} {
  const c = MIX_COMPOSITION_CONSTANTS;
  const kept: Record<string, number> = {};
  let lossOnIgnition_wt = 0;
  for (const [key, value] of Object.entries(composition)) {
    if (value <= 0) continue;
    if (c.lossOnIgnitionKeys.includes(key)) lossOnIgnition_wt += value;
    else if (c.metalElementKeys.includes(key) && value < c.metalImpurityThreshold_wt) continue;
    else kept[key] = value;
  }
  const total = Object.values(kept).reduce((sum, value) => sum + value, 0);
  if (total <= 0) return { phases_wt: {}, lossOnIgnition_wt };
  return {
    phases_wt: Object.fromEntries(Object.entries(kept).map(([key, value]) => [key, (100 * value) / total])),
    lossOnIgnition_wt,
  };
}
