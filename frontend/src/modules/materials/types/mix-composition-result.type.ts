import type { NonOxideComponents } from './non-oxide-components.type';
import type { OxideComposition } from './oxide-composition.type';

export type MixCompositionResult = {
  basis: 'fired';
  lossOnIgnition_wt: number;
  acceptedOxides_wt: OxideComposition;
  acceptedOxides_normalized: OxideComposition;
  otherOxides_wt: Record<string, number>;
  nonOxideComponents_wt: NonOxideComponents;
  droppedMetals_wt: number;
  trueDensity_kgm3: number;
  warnings: string[];
};
