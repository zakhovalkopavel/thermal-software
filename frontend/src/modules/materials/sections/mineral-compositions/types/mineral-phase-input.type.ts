import type { OxideComposition } from '../../../types/oxide-composition.type';

export type MineralPhaseInput = {
  composition: OxideComposition;
  /** °C */
  temperature?: number;
};
