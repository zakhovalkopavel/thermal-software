import type { CementType } from './cement-type.type';
import type { ShrinkageMaterial } from './shrinkage-material.type';

/** Complete shrinkage prediction input. */
export type ShrinkageInput = {
  /** Array of materials in the mix */
  materials: ShrinkageMaterial[];

  /** Mass fractions of each material (must sum to 1) */
  massFractions: number[];

  /** Temperature profile for evaluation (°C) */
  temperatureProfile_C: number[];

  /** Water-to-cement ratio (typical: 0.25-0.45) */
  waterCementRatio?: number;

  /** Mass fraction of cement in mix (0-1) */
  cementContent?: number;

  /** Cement type for chemical shrinkage model */
  cementType?: CementType;

  /** Initial green density (kg/m³) */
  greenDensity_kgm3?: number;

  /** Theoretical density (kg/m³) */
  theoreticalDensity_kgm3?: number;
};
