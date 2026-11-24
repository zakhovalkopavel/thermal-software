import type { ShrinkageStage } from './shrinkage-stage.type';

/** Drying stage specific result. */
export type DryingShrinkage = ShrinkageStage & {
  name: 'drying';

  /** Water content removed (%) */
  waterRemoved_percent: number;

  /** Chemical shrinkage coefficient */
  chemicalShrinkageCoefficient: number;
};
