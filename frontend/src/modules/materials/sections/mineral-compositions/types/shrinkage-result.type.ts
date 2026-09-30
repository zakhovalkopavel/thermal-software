import type { ShrinkageStage } from './shrinkage-stage.type';

export type ShrinkageResult = {
  drying: ShrinkageStage;
  firing: ShrinkageStage[];
  total: ShrinkageStage;
  metadata: {
    greenPorosity_percent: number;
    finalPorosity_percent: number;
    maxShrinkage_volumetric_percent: number;
    tempAtMaxShrinkage_C: number;
    method: string;
  };
  warnings: string[];
};
