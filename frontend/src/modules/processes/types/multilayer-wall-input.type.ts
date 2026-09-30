import type { SmokeComposition } from './smoke-composition.type';
import type { WallGeometry } from './wall-geometry.type';
import type { WallLayer } from './wall-layer.type';

export type MultilayerWallInput = {
  geometry: WallGeometry;
  a_m: number;
  b_m?: number;
  /** Inside → outside. */
  layers: WallLayer[];
  w_ms: number;
  composition: SmokeComposition;
  mPerSecond_kgs: number;
  tFlame_K: number;
  tAmbient_K: number;
  innerEmissivity: number;
  numberOfSteps?: number;
};
