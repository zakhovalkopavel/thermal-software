/**
 * Glass Viscosity Calculator
 * Calculates viscosity and fixed points for amorphous/glassy phases
 *
 * References:
 * - ASTM C965-96: Standard Practice for Measuring Viscosity of Glass Above the Softening Point
 * - Lakatos et al. (1972): Viscosity temperature relations in the glass system SiO₂-Al₂O₃-Na₂O-K₂O-CaO-MgO
 * - Giordano et al. (2008): Viscosity of magmatic liquids: A model, Earth Planet. Sci. Lett.
 */

import { OxideComposition, GlassViscosityPoints } from '../types';

export class GlassViscosityCalculator {

  /**
   * Calculate viscosity at given temperature using appropriate model
   *
   * Reference: Giordano et al. (2008) VFT model for silicate melts
   * η(T) = 10^[A + B/(T-C)]
   */
  public calculateViscosity(
    composition: OxideComposition,
    temperature: number
  ): number {
    // Select model based on composition
    if (this.isAluminosilicate(composition)) {
      return this.calculateAluminosilicateViscosity(composition, temperature);
    } else if (this.isCalciumAluminate(composition)) {
      return this.calculateCalciumAluminateViscosity(composition, temperature);
    } else {
      return this.calculateGenericViscosity(composition, temperature);
    }
  }

  /**
   * Calculate standard viscosity fixed points
   *
   * Reference: ASTM C965-96
   * Note: ASTM defines in poise. Conversion: 1 Pa·s = 10 poise
   *
   * Melting Point: 10 poise = 1 Pa·s - liquid, homogenization
   * Flow Point: 10⁵ poise = 10⁴ Pa·s - upper working limit
   * Working Point: 10⁴ poise = 10³ Pa·s - glass working temperature
   * Softening Point: 10^7.6 poise = 10^6.6 Pa·s - Littleton softening point
   * Annealing Point: 10^13 poise = 10^12 Pa·s - upper glass transition
   * Strain Point: 10^14.5 poise = 10^13.5 Pa·s - lower glass transition
   */
  public calculateFixedPoints(
    composition: OxideComposition
  ): GlassViscosityPoints {
    // Find temperatures for each viscosity level (in Pa·s)
    const melting = this.findTemperatureForViscosity(composition, 1, 1600);      // 10 poise
    const flow = this.findTemperatureForViscosity(composition, 1e4, 1450);       // 10⁵ poise
    const working = this.findTemperatureForViscosity(composition, 1e3, 1400);    // 10⁴ poise
    const softening = this.findTemperatureForViscosity(composition, 10 ** 6.6, 1100); // 10^7.6 poise
    const annealing = this.findTemperatureForViscosity(composition, 1e12, 800);  // 10^13 poise
    const strain = this.findTemperatureForViscosity(composition, 10 ** 13.5, 700); // 10^14.5 poise

    // Glass transition range is between annealing and strain points
    const glassTransitionLow = strain;
    const glassTransitionHigh = annealing;

    return {
      melting,
      flow,
      working,
      softening,
      annealing,
      strain,
      glassTransitionLow,
      glassTransitionHigh
    };
  }

  /**
   * Find temperature that produces target viscosity
   * Uses Newton-Raphson iteration
   */
  private findTemperatureForViscosity(
    composition: OxideComposition,
    targetViscosity: number,
    initialGuess: number = 1000
  ): number {
    let T = initialGuess;
    const maxIterations = 50;

    for (let i = 0; i < maxIterations; i++) {
      const currentVisc = this.calculateViscosity(composition, T);
      const error = currentVisc - targetViscosity;

      if (Math.abs(error / targetViscosity) < 0.01) {
        return Math.round(T);
      }

      // Numerical derivative
      const dT = 1.0;
      const viscPlus = this.calculateViscosity(composition, T + dT);
      const derivative = (viscPlus - currentVisc) / dT;

      if (Math.abs(derivative) < 1e-10) break;

      // Newton step
      T = T - error / derivative;

      // Keep in reasonable range
      T = Math.max(300, Math.min(2000, T));
    }

    return Math.round(T);
  }

  /**
   * Aluminosilicate glass viscosity
   *
   * Reference: Giordano et al. (2008)
   * VFT equation: log₁₀(η) = A + B/(T-C)
   */
  private calculateAluminosilicateViscosity(
    composition: OxideComposition,
    temperature: number
  ): number {
    const T_K = temperature + 273.15;

    // Calculate VFT parameters from composition
    const params = this.calculateVFTParameters(composition);

    // VFT equation
    const log10Visc = params.A + params.B / (T_K - params.C);
    const viscosity = 10 ** log10Visc;

    return Math.max(0.01, Math.min(1e15, viscosity));
  }

  /**
   * Calculate VFT parameters from composition
   *
   * Reference: Giordano et al. (2008), Earth Planet. Sci. Lett. 271, 123-134
   * Simplified model for aluminosilicate systems
   */
  private calculateVFTParameters(composition: OxideComposition): {
    A: number;
    B: number;
    C: number;
  } {
    // Convert to mole fractions (simplified)
    const SiO2 = (composition.SiO2 || 0) / 100;
    const Al2O3 = (composition.Al2O3 || 0) / 100;
    const CaO = (composition.CaO || 0) / 100;
    const MgO = (composition.MgO || 0) / 100;
    const Na2O = (composition.Na2O || 0) / 100;
    const K2O = (composition.K2O || 0) / 100;

    // Empirical parameters (simplified from Giordano et al.)
    // These are approximations for aluminosilicate glasses
    const A = -4.55;

    // B parameter - increases with network formers
    const B = 7000 +
              SiO2 * 3000 +
              Al2O3 * 5000 -
              CaO * 2000 -
              MgO * 1500 -
              (Na2O + K2O) * 2500;

    // C parameter - Vogel temperature
    const C = 300 +
              SiO2 * 200 +
              Al2O3 * 150 -
              CaO * 100 -
              (Na2O + K2O) * 150;

    return { A, B, C };
  }

  /**
   * Calcium aluminate glass viscosity
   *
   * Reference: Mills & Sridhar (1999), Ironmaking Steelmaking 26(4)
   * For CaO-Al₂O₃-SiO₂ melts
   */
  private calculateCalciumAluminateViscosity(
    composition: OxideComposition,
    temperature: number
  ): number {
    const T_K = temperature + 273.15;

    // Arrhenius model for calcium aluminates
    // η = A₀ * exp(E/RT)
    const R = 8.314; // J/(mol·K)

    const CaO = (composition.CaO || 0) / 100;

    // Activation energy (kJ/mol) - decreases with CaO
    const E = 200 - CaO * 100; // Simplified

    const A0 = 0.001; // Pre-exponential factor (Pa·s)

    const viscosity = A0 * Math.exp((E * 1000) / (R * T_K));

    return Math.max(0.01, Math.min(1e15, viscosity));
  }

  /**
   * Generic viscosity model for other compositions
   *
   * Reference: Urbain et al. (1981), modified
   */
  private calculateGenericViscosity(
    composition: OxideComposition,
    temperature: number
  ): number {
    const T_K = temperature + 273.15;

    // Simple Arrhenius with composition-dependent parameters
    const networkFormers = (composition.SiO2 || 0) + (composition.Al2O3 || 0);
    const modifiers = (composition.CaO || 0) + (composition.MgO || 0) +
                      (composition.Na2O || 0) + (composition.K2O || 0);

    const A = 0.001;
    const B = 10000 + networkFormers * 50 - modifiers * 30;

    const viscosity = A * Math.exp(B / T_K);

    return Math.max(0.01, Math.min(1e15, viscosity));
  }

  /**
   * Check if composition is aluminosilicate dominated
   */
  private isAluminosilicate(composition: OxideComposition): boolean {
    const Al2O3 = composition.Al2O3 || 0;
    const SiO2 = composition.SiO2 || 0;
    const CaO = composition.CaO || 0;

    return (Al2O3 + SiO2) > 60 && CaO < 25;
  }

  /**
   * Check if composition is calcium aluminate dominated
   */
  private isCalciumAluminate(composition: OxideComposition): boolean {
    const CaO = composition.CaO || 0;
    const Al2O3 = composition.Al2O3 || 0;

    return CaO > 20 && Al2O3 > 25 && CaO / Al2O3 > 0.5;
  }

  /**
   * Estimate correlation between glass viscosity and RUL
   *
   * Reference: Empirical observation in refractory testing
   * Higher glass content and lower viscosity correlate with lower RUL
   */
  public estimateRULCorrelation(
    glassPercent: number,
    viscosityAtTestTemp: number
  ): {
    criticalGlassContent: number;
    criticalViscosity: number;
    deformationRisk: string;
  } {
    // Critical parameters
    const criticalGlassContent = 30; // % - above this, significant deformation
    const criticalViscosity = 1e6;   // Pa·s - below this, viscous flow significant

    let deformationRisk = 'Low';

    if (glassPercent > 50 || viscosityAtTestTemp < 1e5) {
      deformationRisk = 'Critical';
    } else if (glassPercent > 30 || viscosityAtTestTemp < 1e6) {
      deformationRisk = 'High';
    } else if (glassPercent > 15 || viscosityAtTestTemp < 1e7) {
      deformationRisk = 'Moderate';
    }

    return {
      criticalGlassContent,
      criticalViscosity,
      deformationRisk
    };
  }
}

