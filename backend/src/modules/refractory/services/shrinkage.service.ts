import { Injectable, BadRequestException } from '@nestjs/common';
import { GAS_CONSTANT } from '../constants/calculation-constants';
import {
  ShrinkageMaterial,
  ShrinkageInput,
  ShrinkageResult,
  ShrinkageStage,
  DryingShrinkage,
  FiringShrinkage,
} from '../interfaces/shrinkage-calculator.interface';

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
  // Default chemical shrinkage coefficients
  private readonly CHEMICAL_SHRINKAGE = {
    PC: 0.064,      // Portland cement - Per w/c ratio
    CAC: 0.12,      // Calcium aluminate cement - Higher shrinkage
    gypsum: 0.025,
    generic: 0.08,
  };

  // Default MSC parameters
  private readonly MSC_DEFAULTS = {
    activationEnergy_Jmol: 500000, // 500 kJ/mol for alumina-silicate
    prefactor: 1e13,                // Typical range: 1e12 - 1e14
    targetDensity: 0.95,            // Relative density target (95% theoretical)
  };

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

    // Validate inputs
    if (materials.length !== massFractions.length) {
      throw new BadRequestException('Materials and mass fractions must have same length');
    }

    const fractionSum = massFractions.reduce((sum, f) => sum + f, 0);
    if (Math.abs(fractionSum - 1.0) > 0.001) {
      throw new BadRequestException(`Mass fractions must sum to 1.0 (current: ${fractionSum})`);
    }

    // 1. Calculate chemical shrinkage (drying stage)
    const chemicalShrinkage = this.calculateChemicalShrinkage('CAC', waterCementRatio, cementContent);

    // 2. Calculate average material properties weighted by mass fraction
    let avgActivationEnergy = 0;
    for (let i = 0; i < materials.length; i++) {
      const mat = materials[i];
      const fraction = massFractions[i];
      avgActivationEnergy += (mat.activationEnergy_Jmol || this.MSC_DEFAULTS.activationEnergy_Jmol) * fraction;
    }

    // 3. Calculate sintering shrinkage at each temperature
    const sinteringShrinkage_volFracByTemp: Record<string, number> = {};
    const sinteringShrinkage_linearFracByTemp: Record<string, number> = {};
    const totalVolumetricShrinkageByTemp: Record<string, number> = {};
    const totalLinearShrinkageByTemp: Record<string, number> = {};

    let currentDensity = 0.6; // Initial green density (typical for castables)

    for (const temp of temperatureProfile_C) {
      const holdTime_hours = 1.0; // Standard hold time

      // Use MSC model for sintering
      const newDensity = this.calculateMSCSintering(temp, holdTime_hours, avgActivationEnergy, currentDensity);

      // Volumetric shrinkage from sintering
      const sinteringVolShrinkage = currentDensity > 0 ? (newDensity - currentDensity) / currentDensity : 0;
      const sinteringLinearShrinkage = sinteringVolShrinkage / 3;

      sinteringShrinkage_volFracByTemp[temp.toString()] = sinteringVolShrinkage;
      sinteringShrinkage_linearFracByTemp[temp.toString()] = sinteringLinearShrinkage;

      // Total shrinkage (chemical + sintering)
      totalVolumetricShrinkageByTemp[temp.toString()] = chemicalShrinkage.volumetric + sinteringVolShrinkage;
      totalLinearShrinkageByTemp[temp.toString()] = chemicalShrinkage.linear + sinteringLinearShrinkage;

      currentDensity = newDensity;
    }

    return {
      chemicalShrinkage_volFrac: chemicalShrinkage.volumetric,
      chemicalShrinkage_linearFrac: chemicalShrinkage.linear,
      sinteringShrinkage_volFracByTemp,
      sinteringShrinkage_linearFracByTemp,
      totalVolumetricShrinkageByTemp,
      totalLinearShrinkageByTemp,
      model: 'MSC',
      confidence: 'Medium',
    };
  }

  /**
   * Calculate chemical shrinkage during drying/hydration
   *
   * @param cementType Type of cement ('PC', 'CAC', 'generic')
   * @param waterCementRatio w/c ratio (typically 0.25-0.45 for castables)
   * @param cementContent Mass fraction of cement in mix (0-1)
   * @returns Volumetric and linear shrinkage fractions
   */
  private calculateChemicalShrinkage(
    cementType: 'PC' | 'CAC' | 'generic',
    waterCementRatio: number,
    cementContent: number,
  ) {
    // Validate inputs
    if (waterCementRatio < 0 || waterCementRatio > 1) {
      throw new BadRequestException('Water-cement ratio must be between 0 and 1');
    }
    if (cementContent < 0 || cementContent > 1) {
      throw new BadRequestException('Cement content must be between 0 and 1');
    }

    const coefficient = this.CHEMICAL_SHRINKAGE[cementType];

    // Volumetric shrinkage
    const volumetric = coefficient * waterCementRatio * cementContent;

    // Linear shrinkage (approximate: linear ≈ volumetric / 3)
    const linear = volumetric / 3;

    return { volumetric, linear };
  }

  /**
   * Calculate sintering shrinkage using Master Sintering Curve (MSC)
   *
   * MSC equation: Θ(t,T) = ∫[0,t] exp(-Q / R×T(τ)) dτ
   * Relative density: ρ_rel(Θ) = 1 / (1 + C × exp(-k × Θ))
   *
   * @param temperature_C Temperature (°C)
   * @param time_hours Hold time at temperature (hours)
   * @param activationEnergy_Jmol Sintering activation energy (J/mol)
   * @param initialDensity Initial relative density (0-1)
   * @returns Relative density after sintering
   */
  private calculateMSCSintering(
    temperature_C: number,
    time_hours: number,
    activationEnergy_Jmol: number,
    initialDensity: number = 0.6,
  ): number {
    const T_K = temperature_C + 273.15;
    const time_s = time_hours * 3600;

    // Calculate work of sintering parameter Θ
    // For constant temperature: Θ = t × exp(-Q/RT)
    const theta = time_s * Math.exp(-activationEnergy_Jmol / (GAS_CONSTANT * T_K));

    // Material constants (calibrated for alumina-silicate systems)
    const C = 15.0; // Empirical constant
    const k = 1e-12; // Scaling factor

    // Relative density calculation
    const relativeDensity = 1 / (1 + C * Math.exp(-k * theta));

    // Ensure density doesn't decrease
    return Math.max(initialDensity, Math.min(relativeDensity, 1.0));
  }
}

