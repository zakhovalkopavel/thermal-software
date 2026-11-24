import type { SmokeHandOff } from '../../../types/smoke-hand-off.type';
import type { WallDraft } from '../types/wall-draft.type';

/** Pre-fills flame T, gas flow and composition handed over from Combustion. */
export function withSmoke(draft: WallDraft, smoke: SmokeHandOff): WallDraft {
  return {
    ...draft,
    values: { ...draft.values, tFlame_K: smoke.tFlame_K, mPerSecond_kgs: smoke.mGas_kgs },
    composition: { ...smoke.composition },
  };
}
