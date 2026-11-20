import type { DryingShrinkage } from './drying-shrinkage.type';
import type { FiringShrinkage } from './firing-shrinkage.type';
import type { ShrinkageMetadata } from './shrinkage-metadata.type';
import type { ShrinkageStage } from './shrinkage-stage.type';

/** Complete shrinkage prediction result. */
export type ShrinkageResult = {
  /** Drying stage results */
  drying: DryingShrinkage;

  /** Firing stage results (one entry per temperature) */
  firing: FiringShrinkage[];

  /** Total shrinkage summary */
  total: ShrinkageStage;

  /** Metadata about the calculation */
  metadata: ShrinkageMetadata;

  /** Any warnings or notes about calculation */
  warnings: string[];
};
