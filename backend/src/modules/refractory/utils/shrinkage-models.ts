import { BadRequestException } from '@nestjs/common';
import { PHYSICAL_CONSTANTS } from '../../../common/thermal/constants/physical.constants';
import { celsiusToKelvin } from '../../../common/thermal/utils/temperature';
import { CHEMICAL_SHRINKAGE } from '../constants/chemical-shrinkage.constants';
import { MSC_DEFAULTS } from '../constants/msc-defaults.constants';

/**
 * Chemical shrinkage (drying) and Master Sintering Curve (firing) formulas.
 */
export class ShrinkageModels {
  static chemicalShrinkage(
    cementType: 'PC' | 'CAC' | 'generic',
    waterCementRatio: number,
    cementContent: number,
  ): { volumetric: number; linear: number } {
    if (waterCementRatio < 0 || waterCementRatio > 1) {
      throw new BadRequestException('Water-cement ratio must be between 0 and 1');
    }
    if (cementContent < 0 || cementContent > 1) {
      throw new BadRequestException('Cement content must be between 0 and 1');
    }

    const coefficient = CHEMICAL_SHRINKAGE[cementType];
    const volumetric = coefficient * waterCementRatio * cementContent;
    const linear = volumetric / 3;
    return { volumetric, linear };
  }

  /**
   * MSC: Θ = t × exp(-Q/RT); ρ_rel(Θ) = 1 / (1 + C × exp(-k × Θ))
   */
  static mscSintering(
    temperature_C: number,
    time_hours: number,
    activationEnergy_Jmol: number,
    initialDensity: number = MSC_DEFAULTS.initialGreenDensity,
  ): number {
    const T_K = celsiusToKelvin(temperature_C);
    const time_s = time_hours * 3600;
    const theta = time_s * Math.exp(-activationEnergy_Jmol / (PHYSICAL_CONSTANTS.GAS_CONSTANT_J_MOLK * T_K));

    const C = MSC_DEFAULTS.densityCurveC;
    const k = MSC_DEFAULTS.densityCurveK;
    const relativeDensity = 1 / (1 + C * Math.exp(-k * theta));
    return Math.max(initialDensity, Math.min(relativeDensity, 1.0));
  }

  static mscTheta(temperature_C: number, time_hours: number, activationEnergy_Jmol: number): number {
    const T_K = celsiusToKelvin(temperature_C);
    const time_s = time_hours * 3600;
    return time_s * Math.exp(-activationEnergy_Jmol / (PHYSICAL_CONSTANTS.GAS_CONSTANT_J_MOLK * T_K));
  }
}
