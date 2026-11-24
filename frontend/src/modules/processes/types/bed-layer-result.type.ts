import type { SpeciesValues } from './species-values.type';

export type BedLayerResult = {
  index: number;
  /** Layer centre above the grate. */
  z_m: number;
  tGas_K: number;
  tSolid_K: number;
  deltaT_K: number;
  moleFractions: SpeciesValues;
  carbonBurnRate_kgs: number;
  fuelBurnRate_kgs: number;
  burnRatePerArea_g_s_cm2: number;
  wallLoss_W: number;
  tWallInner_K: number | null;
  tWallOuter_K: number | null;
  hConv_Wm2K: number;
  velocity_ms: number;
  pressureDrop_Pa: number;
  steamInjected: boolean;
};
