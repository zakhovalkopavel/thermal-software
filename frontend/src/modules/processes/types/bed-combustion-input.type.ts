import type { CondensedFuelSelection } from './condensed-fuel-selection.type';
import type { FurnaceWall } from './furnace-wall.type';
import type { WallLayer } from './wall-layer.type';

export type BedCombustionInput = CondensedFuelSelection & {
  bedHeight_m: number;
  diameter_m: number;
  nLayers: number;
  /** Exactly one of mAirPrimary_kgs / airFlow_m3h. */
  mAirPrimary_kgs?: number;
  airFlow_m3h?: number;
  tAirPrimary_K: number;
  steamInjectionPercent?: number;
  /** Required when steamInjectionPercent > 0. */
  steamT_K?: number;
  generatorWallLayers?: WallLayer[];
  /** Required with generatorWallLayers. */
  generatorWallEmissivity?: number;
  /** Required with generatorWallLayers or furnace. */
  tAmbient_K?: number;
  /** At most one of kExcessAir / mAirSecondary_kgs. */
  kExcessAir?: number;
  mAirSecondary_kgs?: number;
  tAirSecondary_K?: number;
  /** At most one of furnace / furnaceHeatLoss_W. */
  furnace?: FurnaceWall;
  furnaceHeatLoss_W?: number;
};
