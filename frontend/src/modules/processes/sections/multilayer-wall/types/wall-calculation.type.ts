import type { MultilayerWallInput } from '../../../types/multilayer-wall-input.type';

export type WallCalculation = {
  input: MultilayerWallInput;
  /** Layer names at request time, inside → outside. */
  layerNames: string[];
};
