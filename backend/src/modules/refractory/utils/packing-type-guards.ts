import type { CPMInput } from '../types/cpm-input.type';
import type { FurnasInput } from '../types/furnas-input.type';
import type { PackingInput } from '../types/packing-input.type';
import type { PackingResult } from '../types/packing-result.type';

/**
 * Runtime type guards for packing calculator shapes.
 * Stateless — no DI.
 */
export class PackingTypeGuards {
  static isPackingInput(obj: any): obj is PackingInput {
    return (
      typeof obj === 'object' &&
      Array.isArray(obj.massFractions) &&
      Array.isArray(obj.densities_kgm3) &&
      Array.isArray(obj.diameters_mm) &&
      obj.massFractions.every((v: any) => typeof v === 'number') &&
      obj.densities_kgm3.every((v: any) => typeof v === 'number') &&
      obj.diameters_mm.every((v: any) => typeof v === 'number')
    );
  }

  static isCPMInput(obj: any): obj is CPMInput {
    const o: any = obj;
    return (
      PackingTypeGuards.isPackingInput(obj) &&
      (o.compactionPressure_MPa === undefined || typeof o.compactionPressure_MPa === 'number') &&
      (o.calibration === undefined ||
        (typeof o.calibration === 'object' &&
          (o.calibration.beta0 === undefined || typeof o.calibration.beta0 === 'number') &&
          (o.calibration.K === undefined || typeof o.calibration.K === 'number')))
    );
  }

  static isFurnasInput(obj: any): obj is FurnasInput {
    const o: any = obj;
    return (
      PackingTypeGuards.isPackingInput(obj) &&
      (o.efficiencyFactor === undefined || typeof o.efficiencyFactor === 'number')
    );
  }

  static isPackingResult(obj: any): obj is PackingResult {
    return (
      typeof obj === 'object' &&
      (obj.model === 'CPM' || obj.model === 'Furnas') &&
      typeof obj.packingFraction_phi === 'number' &&
      typeof obj.porosity_initial === 'number' &&
      typeof obj.effectivePackingDensity === 'number'
    );
  }
}
