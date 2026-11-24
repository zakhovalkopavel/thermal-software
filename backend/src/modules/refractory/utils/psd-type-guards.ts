import type { PSDCalculationRequest } from '../types/psd-calculation-request.type';
import type { PSDFraction } from '../types/psd-fraction.type';
import type { PSDResult } from '../types/psd-result.type';

/**
 * Runtime type guards for PSD calculator shapes.
 * Stateless — no DI.
 */
export class PsdTypeGuards {
  static isPSDFraction(obj: any): obj is PSDFraction {
    return (
      typeof obj === 'object' &&
      typeof obj.dMin_mm === 'number' &&
      typeof obj.dMax_mm === 'number'
    );
  }

  static isPSDCalculationRequest(obj: any): obj is PSDCalculationRequest {
    return (
      typeof obj === 'object' &&
      Array.isArray(obj.fractions) &&
      obj.fractions.every(PsdTypeGuards.isPSDFraction) &&
      typeof obj.q === 'number'
    );
  }

  static isPSDResult(obj: any): obj is PSDResult {
    return (
      typeof obj === 'object' &&
      typeof obj.method === 'string' &&
      typeof obj.q === 'number' &&
      Array.isArray(obj.massFractions) &&
      Array.isArray(obj.massFractionsRoundedPercent) &&
      typeof obj.Dmin_mm === 'number' &&
      typeof obj.Dmax_mm === 'number'
    );
  }
}
