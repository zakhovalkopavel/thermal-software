import type { Dispatch } from 'react';
import type { MaterialEntry } from '../../../types/material-entry.type';
import type { MixAction } from './mix-action.type';
import type { CompleteMixFraction } from './complete-mix-fraction.type';
import type { MixState } from './mix-state.type';

export type MixContextValue = {
  state: MixState;
  dispatch: Dispatch<MixAction>;
  /** Mix components (E9) by id. */
  components: Map<string, MaterialEntry>;
  /** Rows with material, size, mass % > 0 and density. */
  completeFractions: CompleteMixFraction[];
  /** Every row complete with mass % > 0 (Σ = 100 is optional; the backend rescales). */
  ready: boolean;
  massPercentSum: number;
};
