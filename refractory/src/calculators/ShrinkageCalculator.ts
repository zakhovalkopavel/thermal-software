/**
 * Shrinkage Prediction Calculator
 *
 * Predicts volumetric and linear shrinkage during drying and firing stages.
 * Implements chemical shrinkage (hydration/drying) and sintering models.
 *
 * References:
 * - Powers, T.C. & Brownyard, T.L. (1946) "Studies of Physical Properties of Hardened Portland Cement Paste"
 * - Su, H. & Johnson, D.L. (1996) "Master Sintering Curve: A Practical Approach to Sintering"
 * - Coble, R.L. (1961) "Sintering Crystalline Solids" Journal of Applied Physics
 * - Herring, C. (1950) "Diffusional Viscosity of a Polycrystalline Solid"
 *
 * @module ShrinkageCalculator
 */

import { MaterialEntry } from '../types/blend-types';
import { ShrinkageResult } from '../types/blend-types';

export interface ShrinkageInput {
  materials: MaterialEntry[];
  massFractions: number[];  // Must sum to 1
  temperatureProfile_C: number[];
  waterCementRatio?: number;  // Default: 0.35
  cementContent?: number;  // Mass fraction of cement (0-1)
  heatingRate_Cmin?: number;  // Default: 5 °C/min
}

export class ShrinkageCalculator {
  // Physical constants
  private static readonly R = 8.314;  // Gas constant (J/(mol·K))

  // Default chemical shrinkage coefficients
  private static readonly CHEMICAL_SHRINKAGE = {
    portland_cement: 0.064,  // Per w/c ratio
    calcium_aluminate_cement: 0.12,  // Higher shrinkage
    gypsum: 0.025,
    generic_cement: 0.08
  };

  // Default MSC parameters
  private static readonly MSC_DEFAULTS = {
    activationEnergy_Jmol: 500000,  // 500 kJ/mol for alumina-silicate
    prefactor: 1e13,  // Typical range: 1e12 - 1e14
    targetDensity: 0.95  // Relative density target (95% theoretical)
  };

  /**
   * Calculate chemical shrinkage during drying/hydration
   *
   * @param cementType Type of cement ('PC', 'CAC', 'generic')
   * @param waterCementRatio w/c ratio (typically 0.25-0.45 for castables)
   * @param cementContent Mass fraction of cement in mix (0-1)
   * @returns Volumetric shrinkage fraction
   */
  public static calculateChemicalShrinkage(
    cementType: 'PC' | 'CAC' | 'generic',
    waterCementRatio: number,
    cementContent: number
  ): { volumetric: number; linear: number } {
    // Validate inputs
    if (waterCementRatio < 0 || waterCementRatio > 1) {
      throw new Error('Water-cement ratio must be between 0 and 1');
    }
    if (cementContent < 0 || cementContent > 1) {
      throw new Error('Cement content must be between 0 and 1');
    }

    // Select coefficient based on cement type
    let coefficient: number;
    switch (cementType) {
      case 'PC':
        coefficient = this.CHEMICAL_SHRINKAGE.portland_cement;
        break;
      case 'CAC':
        coefficient = this.CHEMICAL_SHRINKAGE.calcium_aluminate_cement;
        break;
      default:
        coefficient = this.CHEMICAL_SHRINKAGE.generic_cement;
    }

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
  public static calculateMSCSintering(
    temperature_C: number,
    time_hours: number,
    activationEnergy_Jmol: number,
    initialDensity: number = 0.60
  ): number {
    const T_K = temperature_C + 273.15;
    const time_s = time_hours * 3600;

    // Calculate work of sintering parameter Θ
    // For constant temperature: Θ = t × exp(-Q/RT)
    const theta = time_s * Math.exp(-activationEnergy_Jmol / (this.R * T_K));

    // Material constants (calibrated for alumina-silicate systems)
    const C = 15.0;  // Empirical constant
    const k = 1e-12;  // Scaling factor

    // Relative density calculation
    const relativeDensity = 1 / (1 + C * Math.exp(-k * theta));

    // Ensure density doesn't decrease
    return Math.max(initialDensity, Math.min(relativeDensity, 1.0));
  }

  /**
   * Calculate sintering shrinkage using simplified diffusion model (Coble)
   *
   * Densification rate: dρ/dt ∝ exp(-Q/RT) / G³
   * Where G = grain size
   *
   * @param temperature_C Temperature (°C)
   * @param time_hours Hold time (hours)
   * @param activationEnergy_Jmol Activation energy (J/mol)
   * @param grainSize_um Average grain size (μm)
   * @param initialDensity Initial relative density
   * @returns Relative density after sintering
   */
  public static calculateDiffusionSintering(
    temperature_C: number,
    time_hours: number,
    activationEnergy_Jmol: number,
    grainSize_um: number,
    initialDensity: number = 0.60
  ): number {
    const T_K = temperature_C + 273.15;
    const time_s = time_hours * 3600;
    const G_m = grainSize_um * 1e-6;

    // Prefactor (includes material constants, surface energy, etc.)
    const A = 1e-15;  // Empirical constant (m³/s)

    // Densification rate (simplified)
    const rate = A * Math.exp(-activationEnergy_Jmol / (this.R * T_K)) / Math.pow(G_m, 3);

    // Integrate over time (simplified: assume constant rate)
    // More accurate would use RK4 or adaptive solver
    const densityChange = rate * time_s * (1 - initialDensity) * 100;  // Scaled

    const finalDensity = initialDensity + densityChange;

    return Math.max(initialDensity, Math.min(finalDensity, 1.0));
  }

  /**
   * Calculate complete shrinkage profile through firing cycle
   *
   * Combines chemical shrinkage (drying) and sintering shrinkage at each temperature
   *
   * @param input Shrinkage calculation inputs
   * @returns Complete shrinkage result with all stages
   */
  public static calculateCompleteShrinkage(input: ShrinkageInput): ShrinkageResult {
    const {
      materials,
      massFractions,
      temperatureProfile_C,
      waterCementRatio = 0.35,
      cementContent = 0.15,
      heatingRate_Cmin = 5 // Reserved for future kinetic models
    } = input;

    // Note: heatingRate_Cmin will be used in future kinetic models
    void heatingRate_Cmin; // Acknowledge unused parameter

    // Validate inputs
    if (materials.length !== massFractions.length) {
      throw new Error('Materials and mass fractions must have same length');
    }

    const fractionSum = massFractions.reduce((sum, f) => sum + f, 0);
    if (Math.abs(fractionSum - 1.0) > 0.001) {
      throw new Error(`Mass fractions must sum to 1.0 (current: ${fractionSum})`);
    }

    // 1. Calculate chemical shrinkage (drying stage)
    const chemicalShrinkage = this.calculateChemicalShrinkage('CAC', waterCementRatio, cementContent);

    // 2. Calculate average material properties weighted by mass fraction
    let avgActivationEnergy = 0;
    let avgGrainSize = 0;
    let totalWeight = 0;

    for (let i = 0; i < materials.length; i++) {
      const mat = materials[i];
      const fraction = massFractions[i];

      avgActivationEnergy += (mat.activationEnergy_Jmol || this.MSC_DEFAULTS.activationEnergy_Jmol) * fraction;
      avgGrainSize += (mat.typicalGrainSize_um || 30) * fraction;
      totalWeight += fraction;
    }

    avgActivationEnergy /= totalWeight;
    avgGrainSize /= totalWeight;

    // 3. Calculate sintering shrinkage at each temperature
    const sinteringShrinkage_volFracByTemp: { [key: string]: number } = {};
    const sinteringShrinkage_linearFracByTemp: { [key: string]: number } = {};
    const totalVolumetricShrinkageByTemp: { [key: string]: number } = {};
    const totalLinearShrinkageByTemp: { [key: string]: number } = {};

    let currentDensity = 0.60;  // Initial green density (typical for castables)

    for (const temp of temperatureProfile_C) {
      // Calculate hold time based on heating rate (simplified)
      const holdTime_hours = 1.0;  // Standard hold time

      // Use MSC model for sintering
      const newDensity = this.calculateMSCSintering(
        temp,
        holdTime_hours,
        avgActivationEnergy,
        currentDensity
      );

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
      confidence: 'Medium'
    };
  }

  /**
   * Estimate confidence level based on input data quality
   * @private Reserved for future quality metrics
   */
  /*private static _estimateConfidence(materials: MaterialEntry[]): 'High' | 'Medium' | 'Low' {
    let dataCompleteness = 0;

    for (const mat of materials) {
      if (mat.activationEnergy_Jmol) dataCompleteness += 1;
      if (mat.typicalGrainSize_um) dataCompleteness += 1;
      if (mat.chemicalShrinkage_volFrac) dataCompleteness += 1;
    }

    const avgCompleteness = dataCompleteness / (materials.length * 3);

    if (avgCompleteness > 0.8) return 'High';
    if (avgCompleteness > 0.5) return 'Medium';
    return 'Low';
  }*/
}

