import { Injectable, BadRequestException } from '@nestjs/common';
import { MSC_DEFAULTS } from '../../constants/msc-defaults.constants';
import type { FiringShrinkage } from '../../types';
import { ShrinkageModels } from '../../utils/shrinkage-models';
import { ShrinkageStages } from '../../utils/shrinkage-stages';

/**
 * Shrinkage Prediction Service
 * Ported from: legacy/refractory/src/calculators/ShrinkageCalculator.ts (283 lines)
 *
 * Predicts volumetric and linear shrinkage during drying and firing stages.
 * Implements chemical shrinkage (hydration/drying) and sintering models.
 *
 * References:
 * - Powers, T.C. & Brownyard, T.L. (1946) "Studies of Physical Properties of Hardened Portland Cement Paste"
 * - Su, H. & Johnson, D.L. (1996) "Master Sintering Curve: A Practical Approach to Sintering"
 * - Coble, R.L. (1961) "Sintering Crystalline Solids" Journal of Applied Physics
 * - Herring, C. (1950) "Diffusional Viscosity of a Polycrystalline Solid"
 */
@Injectable()
export class ShrinkageService {

  /**
   * Calculate complete shrinkage profile through firing cycle
   *
   * Combines chemical shrinkage (drying) and sintering shrinkage at each temperature
   *
   * @param data.materials Array of materials (optional, used for weighted properties)
   * @param data.massFractions Mass fractions (must sum to 1)
   * @param data.temperatureProfile_C Array of temperatures for evaluation
   * @param data.waterCementRatio w/c ratio (typically 0.25-0.45 for castables)
   * @param data.cementContent Mass fraction of cement in mix (0-1)
   * @returns Complete shrinkage result with all stages
   */
  calculateCompleteShrinkage(data: {
    materials: any[];
    massFractions: number[];
    temperatureProfile_C: number[];
    waterCementRatio?: number;
    cementContent?: number;
  }) {
    const {
      materials,
      massFractions,
      temperatureProfile_C,
      waterCementRatio = 0.35,
      cementContent = 0.15,
    } = data;

    if (materials.length !== massFractions.length) {
      throw new BadRequestException('Materials and mass fractions must have same length');
    }

    const fractionSum = massFractions.reduce((sum, f) => sum + f, 0);
    if (Math.abs(fractionSum - 1.0) > 0.001) {
      throw new BadRequestException(`Mass fractions must sum to 1.0 (current: ${fractionSum})`);
    }

    const chemicalShrinkage = ShrinkageModels.chemicalShrinkage('CAC', waterCementRatio, cementContent);

    let avgActivationEnergy = 0;
    for (let i = 0; i < materials.length; i++) {
      const mat = materials[i];
      const fraction = massFractions[i];
      avgActivationEnergy +=
        (mat.activationEnergy_Jmol || MSC_DEFAULTS.activationEnergy_Jmol) * fraction;
    }

    const dryingStage = ShrinkageStages.drying(chemicalShrinkage, waterCementRatio, cementContent);

    const firingStages: FiringShrinkage[] = [];
    const totalVolPercent: number[] = [];
    const totalLinPercent: number[] = [];
    const relativeDensities: number[] = [];

    let currentDensity: number = MSC_DEFAULTS.initialGreenDensity;
    const initialDensity = currentDensity;

    for (const temp of temperatureProfile_C) {
      const holdTime_hours = 1.0;

      const newDensity = ShrinkageModels.mscSintering(
        temp,
        holdTime_hours,
        avgActivationEnergy,
        currentDensity,
      );

      const sinteringVolShrinkage =
        initialDensity > 0 ? (newDensity - initialDensity) / initialDensity : 0;
      const sinteringLinearShrinkage = sinteringVolShrinkage / 3;

      const totalVol = chemicalShrinkage.volumetric + sinteringVolShrinkage;
      const totalLin = chemicalShrinkage.linear + sinteringLinearShrinkage;

      totalVolPercent.push(totalVol * 100);
      totalLinPercent.push(totalLin * 100);
      relativeDensities.push(newDensity);

      firingStages.push(
        ShrinkageStages.firing(
          temp,
          sinteringVolShrinkage,
          newDensity,
          holdTime_hours,
          avgActivationEnergy,
        ),
      );

      currentDensity = newDensity;
    }

    const totalStage = ShrinkageStages.total(
      temperatureProfile_C,
      totalVolPercent,
      totalLinPercent,
      relativeDensities,
    );

    const metadata = ShrinkageStages.metadata(
      totalVolPercent,
      temperatureProfile_C,
      currentDensity,
      waterCementRatio,
      cementContent,
    );

    return {
      drying: dryingStage,
      firing: firingStages,
      total: totalStage,
      metadata,
      warnings: [],
    };
  }

  /**
   * Thin API entry for the shrinkage DTO (single generic material, mass fraction 1).
   */
  calculateFromProfile(data: {
    temperatureProfile_C: number[];
    waterCementRatio?: number;
    cementContent?: number;
  }) {
    return this.calculateCompleteShrinkage({
      materials: [{ activationEnergy_Jmol: MSC_DEFAULTS.activationEnergy_Jmol }],
      massFractions: [1.0],
      temperatureProfile_C: data.temperatureProfile_C,
      waterCementRatio: data.waterCementRatio,
      cementContent: data.cementContent,
    });
  }
}
