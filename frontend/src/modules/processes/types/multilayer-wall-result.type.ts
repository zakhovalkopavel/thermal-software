import type { AlphaResult } from './alpha-result.type';
import type { BetweenLayer } from './between-layer.type';

export type MultilayerWallResult = {
  tInner_K: number;
  tOuter_K: number;
  tGasEnd_K: number;
  tGasAverage_K: number;
  betweenLayers: BetweenLayer[];
  fluxInner_W: number;
  fluxOuter_W: number;
  fluxInnerDensity_Wm2: number;
  sInner_m2: number;
  sOuter_m2: number;
  alphaInner: AlphaResult;
  alphaOuter_Wm2K: number;
  totalThickness_mm: number;
};
