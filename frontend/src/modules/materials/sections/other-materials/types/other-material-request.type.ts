import type { PureGasSpeciesRef } from '../../gases/types/pure-gas-species-ref.type';

export type OtherMaterialRequest = {
  compound: Extract<PureGasSpeciesRef, { source: 'compound' }>;
  temperatures_K: number[];
  P_Pa: number;
  unit: 'K' | 'C';
  mode: 'single' | 'range';
};
