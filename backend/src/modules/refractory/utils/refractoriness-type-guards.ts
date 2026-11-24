import type { ASTMC24Result } from '../types/astm-c24-result.type';
import type { GOST4069Result } from '../types/gost-4069-result.type';
import type { ISO1893Result } from '../types/iso1893-result.type';
import type { RefractorinessInput } from '../types/refractoriness-input.type';
import type { RefractorinessResult } from '../types/refractoriness-result.type';

/**
 * Runtime type guards for refractoriness shapes.
 * Stateless — no DI.
 */
export class RefractorinessTypeGuards {
  static isRefractorinessInput(obj: any): obj is RefractorinessInput {
    return (
      typeof obj === 'object' &&
      typeof obj.composition === 'object' &&
      (obj.standards === undefined || Array.isArray(obj.standards))
    );
  }

  static isRefractorinessResult(obj: any): obj is RefractorinessResult {
    return (
      typeof obj === 'object' &&
      typeof obj.estimatedRefractoriness_C === 'number' &&
      typeof obj.composition === 'object' &&
      Array.isArray(obj.componentEffects) &&
      typeof obj.metadata === 'object' &&
      Array.isArray(obj.warnings)
    );
  }

  static isISO1893Result(obj: any): obj is ISO1893Result {
    return (
      typeof obj === 'object' &&
      obj.standard === 'ISO1893' &&
      typeof obj.T05_C === 'number' &&
      typeof obj.T1_C === 'number' &&
      typeof obj.T2_C === 'number'
    );
  }

  static isASTMC24Result(obj: any): obj is ASTMC24Result {
    return (
      typeof obj === 'object' &&
      obj.standard === 'ASTM_C24' &&
      typeof obj.coneNumber === 'number' &&
      typeof obj.equivalentTemperature_C === 'number'
    );
  }

  static isGOST4069Result(obj: any): obj is GOST4069Result {
    return (
      typeof obj === 'object' &&
      obj.standard === 'GOST_4069' &&
      typeof obj.coneEquivalent === 'number' &&
      typeof obj.refractorinessTemperature_C === 'number'
    );
  }
}
