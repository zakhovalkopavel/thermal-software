import type { CementType } from './cement-type.type';

export type ShrinkageInput = {
  temperatureProfile_C: number[];
  waterCementRatio?: number;
  cementContent?: number;
  cementType?: CementType;
  holdTime_hours?: number;
};
