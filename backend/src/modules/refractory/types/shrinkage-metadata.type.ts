import type { CementType } from './cement-type.type';

/** Metadata for shrinkage calculation. */
export type ShrinkageMetadata = {
  /** Calculation timestamp */
  calculatedAt: Date;

  /** Total mix density (kg/m³) */
  mixDensity_kgm3: number;

  /** Theoretical density (kg/m³) */
  theoreticalDensity_kgm3: number;

  /** Initial green porosity (%) */
  greenPorosity_percent: number;

  /** Final porosity after firing (%) */
  finalPorosity_percent: number;

  /** Maximum shrinkage value (%) */
  maxShrinkage_volumetric_percent: number;

  /** Temperature at maximum shrinkage (°C) */
  tempAtMaxShrinkage_C: number;

  /** Calculation method used */
  method: 'master-sintering-curve' | 'chemical-based';

  /** Model parameters used */
  parameters: {
    waterCementRatio: number;
    cementContent: number;
    cementType: CementType;
  };
};
