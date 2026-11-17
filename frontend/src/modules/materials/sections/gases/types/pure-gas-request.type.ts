import type { PureGasSpeciesRef } from './pure-gas-species-ref.type';

export type PureGasRequest = {
  mode: 'single' | 'range';
  gases: PureGasSpeciesRef[];
  temperatures_K: number[];
  P_Pa: number;
};
