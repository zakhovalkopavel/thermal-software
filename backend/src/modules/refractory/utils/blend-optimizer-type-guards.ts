import type { BlendOptimizationOptions } from '../types/blend-optimization-options.type';
import type { BlendOptimizationRequest } from '../types/blend-optimization-request.type';
import type { Fraction } from '../types/fraction.type';

/**
 * Runtime type guards for blend optimizer shapes.
 * Stateless — no DI.
 */
export class BlendOptimizerTypeGuards {
  static isFraction(obj: any): obj is Fraction {
    return (
      typeof obj === 'object' &&
      typeof obj.dMin_mm === 'number' &&
      typeof obj.dMax_mm === 'number'
    );
  }

  static isBlendOptimizationOptions(obj: any): obj is BlendOptimizationOptions {
    return (
      typeof obj === 'object' &&
      (obj.qValues === undefined || Array.isArray(obj.qValues)) &&
      (obj.methods === undefined || Array.isArray(obj.methods)) &&
      (obj.packingModels === undefined || Array.isArray(obj.packingModels)) &&
      (obj.scenarios === undefined || Array.isArray(obj.scenarios))
    );
  }

  static isBlendOptimizationRequest(obj: any): obj is BlendOptimizationRequest {
    return (
      typeof obj === 'object' &&
      Array.isArray(obj.fractions) &&
      obj.fractions.every(BlendOptimizerTypeGuards.isFraction) &&
      (obj.options === undefined ||
        BlendOptimizerTypeGuards.isBlendOptimizationOptions(obj.options))
    );
  }
}
