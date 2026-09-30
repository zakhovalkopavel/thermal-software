import { PROCESSES_UI } from '../../../constants/processes-ui.constants';
import type { SmokeComposition } from '../../../types/smoke-composition.type';
import type { SmokeHandOff } from '../../../types/smoke-hand-off.type';
import type { CombustionSummary } from '../types/combustion-summary.type';

/** Last-step composition reduced to the six smoke species and renormalised to Σ = 1. */
export function toSmokeHandOff(summary: CombustionSummary): SmokeHandOff {
  const fractions = summary.lastStep.products.moleFractions;
  const sum = PROCESSES_UI.smokeSpecies.reduce((total, species) => total + (fractions[species] ?? 0), 0);
  const round = (value: number) => Number(value.toFixed(PROCESSES_UI.gasFractionDecimals));
  const composition = Object.fromEntries(
    PROCESSES_UI.smokeSpecies.map((species) => [species, sum > 0 ? round((fractions[species] ?? 0) / sum) : 0]),
  ) as SmokeComposition;
  return { tFlame_K: summary.tFlame_K, mGas_kgs: summary.lastStep.mGas_kgs, composition };
}
