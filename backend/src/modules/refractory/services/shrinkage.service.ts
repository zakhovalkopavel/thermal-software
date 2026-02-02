import { Injectable, BadRequestException } from '@nestjs/common';
import { GAS_CONSTANT } from '../constants/calculation-constants';
import { ShrinkageStage, DryingShrinkage, FiringShrinkage, } from '../interfaces';

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

    // 3. Build drying stage
    const dryingStage = this.buildDryingStage(chemicalShrinkage, waterCementRatio, cementContent);

    // 4. Calculate sintering shrinkage at each temperature (firing stages)
    const firingStages: FiringShrinkage[] = [];
    const totalVolPercent: number[] = [];
    const totalLinPercent: number[] = [];
    const relativeDensities: number[] = [];

    let currentDensity = 0.6; // Initial green density (typical for castables)
    const initialDensity = currentDensity;

    for (const temp of temperatureProfile_C) {
      const holdTime_hours = 1.0; // Standard hold time

      // Use MSC model for sintering
      const newDensity = this.calculateMSCSintering(temp, holdTime_hours, avgActivationEnergy, currentDensity);

      // Volumetric shrinkage from sintering (relative to initial)
      const sinteringVolShrinkage = initialDensity > 0 ? (newDensity - initialDensity) / initialDensity : 0;
      const sinteringLinearShrinkage = sinteringVolShrinkage / 3;

      // Total shrinkage (chemical + sintering)
      const totalVol = chemicalShrinkage.volumetric + sinteringVolShrinkage;
      const totalLin = chemicalShrinkage.linear + sinteringLinearShrinkage;

      totalVolPercent.push(totalVol * 100);
      totalLinPercent.push(totalLin * 100);
      relativeDensities.push(newDensity);

      // Create firing stage for this temperature
      firingStages.push(
        this.buildFiringStage(temp, sinteringVolShrinkage, newDensity, holdTime_hours, avgActivationEnergy)
      );

      currentDensity = newDensity;
    }

    // 5. Build total stage summary
    const totalStage = this.buildTotalStage(temperatureProfile_C, totalVolPercent, totalLinPercent, relativeDensities);

    // 6. Build metadata
    const metadata = this.buildMetadata(
      totalVolPercent,
      temperatureProfile_C,
      currentDensity,
      waterCementRatio,
      cementContent,
    );

    // 7. Return complete ShrinkageResult
    return {
      drying: dryingStage,
      firing: firingStages,
      total: totalStage,
      metadata,
      warnings: [],
    };
  }

  /**
   * Calculate MSC theta parameter for metadata
   */
  private calculateMSCTheta(temperature_C: number, time_hours: number, activationEnergy_Jmol: number): number {
    const T_K = temperature_C + 273.15;
    const time_s = time_hours * 3600;
    return time_s * Math.exp(-activationEnergy_Jmol / (GAS_CONSTANT * T_K));
  }

  /**
   * Build drying stage result from chemical shrinkage
   *
   * @param chemicalShrinkage Chemical shrinkage values (volumetric and linear)
   * @param waterCementRatio Water-to-cement ratio
   * @param cementContent Cement content fraction
   * @returns DryingShrinkage stage data
   */
  private buildDryingStage(
    chemicalShrinkage: { volumetric: number; linear: number },
    waterCementRatio: number,
    cementContent: number,
  ): DryingShrinkage {
    return {
      name: 'drying',
      temperatures_C: [20], // Room temperature drying
      shrinkage_volumetric_percent: [chemicalShrinkage.volumetric * 100],
      shrinkage_linear_percent: [chemicalShrinkage.linear * 100],
      relativeDensity: [0.6], // Initial green density
      description: 'Chemical shrinkage during drying/hydration',
      waterRemoved_percent: Math.min(100, waterCementRatio * cementContent * 100),
      chemicalShrinkageCoefficient: this.CHEMICAL_SHRINKAGE.CAC,
    };
  }

  /**
   * Build firing stage result for a single temperature point
   *
   * @param temperature Temperature (°C)
   * @param sinteringVolShrinkage Volumetric shrinkage from sintering (fraction)
   * @param newDensity New relative density after sintering
   * @param holdTime_hours Hold time at temperature (hours)
   * @param avgActivationEnergy Average activation energy (J/mol)
   * @returns FiringShrinkage stage data
   */
  private buildFiringStage(
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
      masterSinteringCurve_theta: this.calculateMSCTheta(temperature, holdTime_hours, avgActivationEnergy),
    };
  }

  /**
   * Build total stage summary combining all shrinkage stages
   *
   * @param temperatures_C Temperature profile
   * @param totalVolPercent Total volumetric shrinkage at each temperature (%)
   * @param totalLinPercent Total linear shrinkage at each temperature (%)
   * @param relativeDensities Relative densities at each temperature
   * @returns ShrinkageStage total summary
   */
  private buildTotalStage(
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

  /**
   * Build metadata for shrinkage calculation result
   *
   * @param totalVolPercent Total volumetric shrinkage percentages
   * @param temperatureProfile_C Temperature profile
   * @param finalDensity Final relative density
   * @param waterCementRatio Water-to-cement ratio
   * @param cementContent Cement content fraction
   * @returns ShrinkageMetadata object
   */
  private buildMetadata(
    totalVolPercent: number[],
    temperatureProfile_C: number[],
    finalDensity: number,
    waterCementRatio: number,
    cementContent: number,
  ) {
    const maxShrinkageVol = Math.max(...totalVolPercent);
    const maxShrinkageIdx = totalVolPercent.indexOf(maxShrinkageVol);
    const theoreticalDensity = 3500; // kg/m³ for typical alumina-silicate refractories
    const greenDensity = 0.6; // Initial green density

    return {
      calculatedAt: new Date(),
      mixDensity_kgm3: theoreticalDensity * finalDensity,
      theoreticalDensity_kgm3: theoreticalDensity,
      greenPorosity_percent: (1 - greenDensity) * 100,
      finalPorosity_percent: (1 - finalDensity) * 100,
      maxShrinkage_volumetric_percent: maxShrinkageVol,
      tempAtMaxShrinkage_C: temperatureProfile_C[maxShrinkageIdx] || temperatureProfile_C[temperatureProfile_C.length - 1],
      method: 'master-sintering-curve' as const,
      parameters: {
        waterCementRatio,
        cementContent,
        cementType: 'CAC' as const,
      },
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
