/**
 * Viscosity Calculator
 * Calculates liquid phase viscosity using Arrhenius model
 */

import { BaseCalculator } from '../core/BaseCalculator';
import { OxideComposition, RefractoryConfig } from '../types';

export class ViscosityCalculator extends BaseCalculator {
  constructor(private config: RefractoryConfig) {
    super();
  }

  protected validateInput(composition: OxideComposition, temperature: number): void {
    if (!composition || Object.keys(composition).length === 0) {
      throw new Error('Composition cannot be empty');
    }

    if (temperature < this.config.minTemperature) {
      throw new Error(`Temperature ${temperature}°C below minimum`);
    }
  }

  /**
   * Calculate viscosity using Arrhenius equation: η = A * exp(B/T)
   */
  public calculateViscosity(
    liquidComposition: OxideComposition,
    temperature: number
  ): number {
    this.validateInput(liquidComposition, temperature);

    const T_kelvin = temperature + 273.15;

    // Base parameters
    let A = this.config.viscosity.A_base;
    let B = this.config.viscosity.B_base;

    // Composition effects (convert % to fractions)
    const Al2O3_frac = (liquidComposition.Al2O3 || 0) / 100;
    const SiO2_frac = (liquidComposition.SiO2 || 0) / 100;
    const CaO_frac = (liquidComposition.CaO || 0) / 100;
    const Fe2O3_frac = (liquidComposition.Fe2O3 || 0) / 100;

    // Modify B based on composition
    // Network formers (Al2O3, SiO2) increase viscosity
    // Network modifiers (CaO, Fe2O3) decrease viscosity
    B += Al2O3_frac * this.config.viscosity.Al2O3_effect;
    B += SiO2_frac * this.config.viscosity.SiO2_effect;
    B += CaO_frac * this.config.viscosity.CaO_effect;
    B += Fe2O3_frac * this.config.viscosity.Fe2O3_effect;

    // Calculate viscosity
    let viscosity = A * Math.exp(B / T_kelvin);

    // Apply bounds
    viscosity = Math.max(this.config.viscosity.minViscosity, viscosity);
    viscosity = Math.min(this.config.viscosity.maxViscosity, viscosity);

    // Round to significant figures
    const sigFigs = this.config.rounding.viscositySignificantFigures;
    viscosity = this.roundToSignificantFigures(viscosity, sigFigs);

    return viscosity;
  }

  /**
   * Round number to specified significant figures
   */
  private roundToSignificantFigures(value: number, sigFigs: number): number {
    if (value === 0) return 0;

    const magnitude = Math.pow(10, Math.floor(Math.log10(Math.abs(value))));
    const multiplier = Math.pow(10, sigFigs - 1);

    return Math.round(value / magnitude * multiplier) * magnitude / multiplier;
  }

  protected calculate(): any {
    throw new Error('Use calculateViscosity');
  }
}

