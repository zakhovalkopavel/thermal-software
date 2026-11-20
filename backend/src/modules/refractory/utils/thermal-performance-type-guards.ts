import type { SpecificHeatResult } from '../types/specific-heat-result.type';
import type { ThermalConductivityInput } from '../types/thermal-conductivity-input.type';
import type { ThermalConductivityResult } from '../types/thermal-conductivity-result.type';
import type { ThermalExpansionResult } from '../types/thermal-expansion-result.type';
import type { ThermalInput } from '../types/thermal-input.type';
import type { ThermalPerformanceResult } from '../types/thermal-performance-result.type';

/**
 * Runtime type guards for thermal-performance shapes.
 * Stateless — no DI.
 */
export class ThermalPerformanceTypeGuards {
  static isThermalInput(obj: any): obj is ThermalInput {
    return (
      typeof obj === 'object' &&
      typeof obj.composition === 'object' &&
      typeof obj.temperature === 'number'
    );
  }

  static isThermalConductivityInput(obj: any): obj is ThermalConductivityInput {
    const o: any = obj;
    return (
      ThermalPerformanceTypeGuards.isThermalInput(obj) &&
      (o.bulkDensity_kgm3 === undefined || typeof o.bulkDensity_kgm3 === 'number')
    );
  }

  static isThermalConductivityResult(obj: any): obj is ThermalConductivityResult {
    return (
      typeof obj === 'object' &&
      typeof obj.effectiveConductivity_WmK === 'number' &&
      typeof obj.temperature === 'number' &&
      Array.isArray(obj.componentContributions)
    );
  }

  static isSpecificHeatResult(obj: any): obj is SpecificHeatResult {
    return (
      typeof obj === 'object' &&
      typeof obj.specificHeat_JkgK === 'number' &&
      typeof obj.temperature === 'number'
    );
  }

  static isThermalExpansionResult(obj: any): obj is ThermalExpansionResult {
    return (
      typeof obj === 'object' &&
      typeof obj.linearExpansionCoefficient_1perK === 'number' &&
      typeof obj.temperature === 'number'
    );
  }

  static isThermalPerformanceResult(obj: any): obj is ThermalPerformanceResult {
    const o: any = obj;
    return (
      typeof obj === 'object' &&
      typeof obj.temperature === 'number' &&
      typeof obj.composition === 'object' &&
      typeof o.metadata === 'object' &&
      Array.isArray(obj.warnings)
    );
  }
}
