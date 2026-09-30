import type { SmokeComposition } from './smoke-composition.type';

/** Router state passed from Combustion to the multilayer wall form. */
export type SmokeHandOff = {
  tFlame_K: number;
  mGas_kgs: number;
  composition: SmokeComposition;
};
