import type { MultilayerWallResult } from '../../../types/multilayer-wall-result.type';
import type { WallCalculation } from './wall-calculation.type';
import type { WallVariant } from './wall-variant.type';

export type WallTemperatureChartProps = {
  calculation: WallCalculation;
  result: MultilayerWallResult;
  pinned: WallVariant[];
};
