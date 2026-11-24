import type { ShrinkageInput } from '../types/shrinkage-input.type';
import type { ShrinkageMaterial } from '../types/shrinkage-material.type';
import type { ShrinkageResult } from '../types/shrinkage-result.type';
import type { ShrinkageStage } from '../types/shrinkage-stage.type';

/**
 * Runtime type guards for shrinkage calculator shapes.
 * Stateless — no DI.
 */
export class ShrinkageTypeGuards {
  static isShrinkageMaterial(obj: any): obj is ShrinkageMaterial {
    return typeof obj === 'object' && typeof obj.name === 'string';
  }

  static isShrinkageInput(obj: any): obj is ShrinkageInput {
    return (
      typeof obj === 'object' &&
      Array.isArray(obj.materials) &&
      obj.materials.every(ShrinkageTypeGuards.isShrinkageMaterial) &&
      Array.isArray(obj.massFractions) &&
      Array.isArray(obj.temperatureProfile_C)
    );
  }

  static isShrinkageStage(obj: any): obj is ShrinkageStage {
    return (
      typeof obj === 'object' &&
      typeof obj.name === 'string' &&
      Array.isArray(obj.temperatures_C) &&
      Array.isArray(obj.shrinkage_volumetric_percent) &&
      Array.isArray(obj.shrinkage_linear_percent)
    );
  }

  static isShrinkageResult(obj: any): obj is ShrinkageResult {
    return (
      typeof obj === 'object' &&
      ShrinkageTypeGuards.isShrinkageStage(obj.drying) &&
      Array.isArray(obj.firing) &&
      obj.firing.every(ShrinkageTypeGuards.isShrinkageStage) &&
      ShrinkageTypeGuards.isShrinkageStage(obj.total) &&
      typeof obj.metadata === 'object'
    );
  }
}
