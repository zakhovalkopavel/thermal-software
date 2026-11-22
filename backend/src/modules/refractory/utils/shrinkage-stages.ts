import type { DryingShrinkage, FiringShrinkage, ShrinkageStage } from '../types';
import { CHEMICAL_SHRINKAGE } from '../constants/chemical-shrinkage.constants';
import { MSC_DEFAULTS } from '../constants/msc-defaults.constants';
import { ShrinkageModels } from './shrinkage-models';

/**
 * Builds drying / firing / total stage payloads for shrinkage results.
 */
export class ShrinkageStages {
  static drying(
    chemicalShrinkage: { volumetric: number; linear: number },
    waterCementRatio: number,
    cementContent: number,
  ): DryingShrinkage {
    return {
      name: 'drying',
      temperatures_C: [20],
      shrinkage_volumetric_percent: [chemicalShrinkage.volumetric * 100],
      shrinkage_linear_percent: [chemicalShrinkage.linear * 100],
      relativeDensity: [MSC_DEFAULTS.initialGreenDensity],
      description: 'Chemical shrinkage during drying/hydration',
      waterRemoved_percent: Math.min(100, waterCementRatio * cementContent * 100),
      chemicalShrinkageCoefficient: CHEMICAL_SHRINKAGE.CAC,
    };
  }

  static firing(
    temperature: number,
    sinteringVolShrinkage: number,
    newDensity: number,
    holdTime_hours: number,
    avgActivationEnergy: number,
  ): FiringShrinkage {
    const sinteringLinearShrinkage = sinteringVolShrinkage / 3;
    return {
      name: 'firing',
      temperatures_C: [temperature],
      shrinkage_volumetric_percent: [sinteringVolShrinkage * 100],
      shrinkage_linear_percent: [sinteringLinearShrinkage * 100],
      relativeDensity: [newDensity],
      description: `Sintering at ${temperature}°C`,
      sinteringTemperature_C: temperature,
      sinteringRate: Math.abs(sinteringVolShrinkage) / holdTime_hours,
      masterSinteringCurve_theta: ShrinkageModels.mscTheta(
        temperature,
        holdTime_hours,
        avgActivationEnergy,
      ),
    };
  }

  static total(
    temperatures_C: number[],
    totalVolPercent: number[],
    totalLinPercent: number[],
    relativeDensities: number[],
  ): ShrinkageStage {
    return {
      name: 'total',
      temperatures_C,
      shrinkage_volumetric_percent: totalVolPercent,
      shrinkage_linear_percent: totalLinPercent,
      relativeDensity: relativeDensities,
      description: 'Total shrinkage (chemical + sintering)',
    };
  }

  static metadata(
    totalVolPercent: number[],
    temperatureProfile_C: number[],
    finalDensity: number,
    waterCementRatio: number,
    cementContent: number,
  ) {
    const maxShrinkageVol = Math.max(...totalVolPercent);
    const maxShrinkageIdx = totalVolPercent.indexOf(maxShrinkageVol);
    const theoreticalDensity = MSC_DEFAULTS.theoreticalDensity_kgm3;
    const greenDensity = MSC_DEFAULTS.initialGreenDensity;

    return {
      calculatedAt: new Date(),
      mixDensity_kgm3: theoreticalDensity * finalDensity,
      theoreticalDensity_kgm3: theoreticalDensity,
      greenPorosity_percent: (1 - greenDensity) * 100,
      finalPorosity_percent: (1 - finalDensity) * 100,
      maxShrinkage_volumetric_percent: maxShrinkageVol,
      tempAtMaxShrinkage_C:
        temperatureProfile_C[maxShrinkageIdx] ||
        temperatureProfile_C[temperatureProfile_C.length - 1],
      method: 'master-sintering-curve' as const,
      parameters: {
        waterCementRatio,
        cementContent,
        cementType: 'CAC' as const,
      },
    };
  }
}
