/**
 * Thermal Performance Calculator
 * Calculates refractoriness and deformation temperature
 */

import { BaseCalculator } from '../core/BaseCalculator';
import { LiquidPhase, RefractoryConfig, SolidPhase, ThermalPerformance } from '../types';

export class ThermalPerformanceCalculator extends BaseCalculator {
  constructor(private config: RefractoryConfig) {
    super();
  }

  protected validateInput(liquid: LiquidPhase, solid: SolidPhase): void {
    if (!liquid || !solid) {
      throw new Error('Both liquid and solid phases required');
    }
  }

  /**
   * Calculate thermal performance metrics
   */
  public calculate(
    liquid: LiquidPhase,
    solid: SolidPhase,
    temperature: number
  ): ThermalPerformance {
    this.validateInput(liquid, solid);
    this.resetDiagnostics();

    // Calculate refractoriness (softening point)
    let refractoriness = this.calculateRefractoriness(liquid, solid);

    // Calculate RUL (Refractoriness Under Load)
    let RUL = this.calculateRUL(liquid, solid, temperature, refractoriness);

    // Round results
    const decimals = this.config.rounding.temperatureDecimals;
    refractoriness = this.roundToDecimals(refractoriness, decimals);
    RUL = this.roundToDecimals(RUL, decimals);

    return {
      refractoriness,
      deformationTemperature_0_2MPa: RUL
    };
  }

  /**
   * Calculate refractoriness (softening temperature)
   */
  private calculateRefractoriness(liquid: LiquidPhase, solid: SolidPhase): number {
    let refractoriness = this.config.refractoriness.T_base_softening;

    // Increase with solid Al2O3 content
    const solidAl2O3_frac = (solid.composition.Al2O3 || 0) / 100;
    refractoriness += (solidAl2O3_frac - 0.5) * this.config.refractoriness.Al2O3Sensitivity;

    // Decrease with liquid fraction
    refractoriness -= (liquid.percent / 10) * this.config.refractoriness.liquidSensitivity;

    // Flux effect (CaO, Fe2O3 in solid)
    const fluxContent = ((solid.composition.CaO || 0) + (solid.composition.Fe2O3 || 0)) / 100;
    refractoriness -= fluxContent * this.config.refractoriness.fluxSensitivity;

    // Apply bounds
    refractoriness = Math.max(this.config.refractoriness.minRefractoriness, refractoriness);
    refractoriness = Math.min(this.config.refractoriness.maxRefractoriness, refractoriness);

    return refractoriness;
  }

  /**
   * Calculate RUL (Refractoriness Under Load at 0.2 MPa)
   */
  private calculateRUL(
    liquid: LiquidPhase,
    solid: SolidPhase,
    temperature: number,
    refractoriness: number
  ): number {
    let RUL = this.config.refractoriness.T_base_RUL;

    // Critical thresholds for liquid content
    if (liquid.percent > 50) {
      // >50% liquid = material is a slurry, essentially no structural integrity
      RUL = temperature - 150;
      this.addWarning(
        `CRITICAL: ${liquid.percent.toFixed(1)}% liquid - material is a slurry with no load-bearing capacity`
      );
    } else if (liquid.percent > 30) {
      // >30% liquid = severe deformation under load
      RUL = temperature - 100;
      this.addWarning(
        `Very high liquid content (${liquid.percent.toFixed(1)}%) - severe deformation expected under load`
      );
    } else if (liquid.percent > this.config.refractoriness.liquidThresholdForRUL) {
      // Moderate liquid = deformation starts near current temperature
      RUL = temperature - 50;
      this.addWarning(
        `High liquid content (${liquid.percent.toFixed(1)}%) - significant deformation expected`
      );
    } else {
      // Low liquid content - use composition-based calculation
      const solidAl2O3_frac = (solid.composition.Al2O3 || 0) / 100;
      RUL += (solidAl2O3_frac - 0.5) * this.config.refractoriness.Al2O3Sensitivity * 0.8;
      RUL -= (liquid.percent / 10) * this.config.refractoriness.liquidSensitivity * 0.9;
    }

    // Apply bounds
    RUL = Math.max(this.config.refractoriness.minRefractoriness, RUL);
    RUL = Math.min(refractoriness, RUL); // RUL should not exceed refractoriness
    RUL = Math.min(RUL, temperature); // RUL cannot exceed test temperature

    return RUL;
  }

  /**
   * Round to specified decimal places
   */
  private roundToDecimals(value: number, decimals: number): number {
    const multiplier = Math.pow(10, decimals);
    return Math.round(value * multiplier) / multiplier;
  }
}

