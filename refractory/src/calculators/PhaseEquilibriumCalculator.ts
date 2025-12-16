/**
 * Phase Equilibrium Calculator
 * Calculates liquid-solid phase distribution
 *
 * References:
 * - Kingery et al. (1976): Introduction to Ceramics, 2nd ed., Wiley
 * - Levin et al. (1964): Phase Diagrams for Ceramists, ACerS
 * - Nurse et al. (1965): J. Am. Ceram. Soc. 48(8), 439-442 (CaO-Al₂O₃-SiO₂ system)
 * - Osborn & Muan (1960): Revised Phase Equilibrium Diagrams
 */

import { BaseCalculator } from '../core/BaseCalculator';
import { PhaseDiagramRepository } from '../repositories/PhaseDiagramRepository';
import { MineralPhaseIdentifier } from './MineralPhaseIdentifier';
import { LiquidPhase, OxideComposition, RefractoryConfig, SolidPhase } from '../types';

export class PhaseEquilibriumCalculator extends BaseCalculator {
  private phaseDiagramRepo: PhaseDiagramRepository;
  private mineralIdentifier: MineralPhaseIdentifier;

  constructor(private config: RefractoryConfig) {
    super();
    this.phaseDiagramRepo = PhaseDiagramRepository.getInstance();
    this.mineralIdentifier = new MineralPhaseIdentifier();
  }

  protected validateInput(composition: OxideComposition, temperature: number): void {
    if (!composition || Object.keys(composition).length === 0) {
      throw new Error('Composition cannot be empty');
    }

    if (temperature < this.config.minTemperature || temperature > this.config.maxTemperature) {
      throw new Error(`Temperature ${temperature}°C out of valid range`);
    }
  }

  /**
   * Calculate liquid-solid split
   */
  public calculateLiquidSolidSplit(
    availableComposition: OxideComposition,
    temperature: number,
    totalMass: number = 100
  ): { liquid: LiquidPhase; solid: SolidPhase } {
    this.validateInput(availableComposition, temperature);
    this.resetDiagnostics();

    // Get primary eutectic
    const eutectic = this.phaseDiagramRepo.getEutectic('CAS', 'anorthite_gehlenite');

    if (!eutectic) {
      throw new Error('Could not load eutectic data');
    }

    // Determine liquid fraction based on temperature above eutectic
    let liquidPercent = 0;
    const eutecticTemp = eutectic.temperature;

    if (temperature > eutecticTemp) {
      const tempAboveEutectic = temperature - eutecticTemp;
      const estimatedLiquidus = this.estimateLiquidus(availableComposition);

      if (temperature >= estimatedLiquidus) {
        liquidPercent = 100; // Fully liquid
      } else {
        // Non-linear model: liquid forms slowly near eutectic, rapidly near liquidus
        // Use power function to make it more realistic
        const tempRange = estimatedLiquidus - eutecticTemp;
        const tempFraction = tempAboveEutectic / tempRange;

        // Power of 3.0 makes liquid formation slower at lower temperatures
        // This accounts for kinetics and refractory nature of aggregates
        let normalizedLiquid = Math.pow(tempFraction, 3.0);

        // Scale down by factor of 0.4 to account for:
        // - Kinetic limitations (diffusion-controlled)
        // - Coarse particle size (limited reactive surface)
        // - High refractory content (Al2O3 stays solid)
        normalizedLiquid *= 0.4;

        liquidPercent = normalizedLiquid * 100;
        liquidPercent = Math.min(100, Math.max(0, liquidPercent));

        // Add warning if liquid formation seems high
        if (liquidPercent > 25 && temperature < estimatedLiquidus - 100) {
          this.addWarning(
            `Significant liquid formation (${liquidPercent.toFixed(1)}%) ` +
            `at ${temperature}°C - verify with experimental data`
          );
        }
      }
    }

    const solidPercent = 100 - liquidPercent;

    // Calculate liquid composition (approaches eutectic composition)
    const liquidComposition = this.calculateLiquidComposition(
      availableComposition,
      eutectic.composition,
      liquidPercent
    );

    // Calculate solid composition (enriched in refractory oxides)
    const solidComposition = this.calculateSolidComposition(
      availableComposition,
      liquidComposition,
      liquidPercent,
      solidPercent
    );

    const liquid: LiquidPhase = {
      percent: liquidPercent,
      mass: (liquidPercent / 100) * totalMass,
      composition: liquidComposition,
      temperature
    };

    const solid: SolidPhase = {
      percent: solidPercent,
      mass: (solidPercent / 100) * totalMass,
      composition: solidComposition,
      mineralogy: this.mineralIdentifier.identifyPhases(solidComposition, temperature)
    };

    // Add assumptions
    this.addAssumption('CAS ternary system approximation used');
    this.addAssumption(`Anorthite:Gehlenite ratio ${this.config.liquidFormation.anorthiteRatio}:${this.config.liquidFormation.gehleniteRatio}`);
    this.addAssumption('Mineral phases identified based on oxide composition and temperature');

    return { liquid, solid };
  }

  /**
   * Estimate liquidus temperature
   */
  private estimateLiquidus(composition: OxideComposition): number {
    const Al2O3 = composition.Al2O3 || 0;
    const SiO2 = composition.SiO2 || 0;
    const CaO = composition.CaO || 0;

    // Simplified estimation - high Al2O3 increases liquidus
    let liquidus = 1400;
    liquidus += (Al2O3 / 100) * 400;  // Al2O3 increases liquidus
    liquidus += (SiO2 / 100) * 200;   // SiO2 moderately increases
    liquidus -= (CaO / 100) * 300;    // CaO decreases (flux)

    return Math.max(1300, Math.min(1800, liquidus));
  }

  /**
   * Calculate liquid composition using selective melting
   * CaO-rich phases melt preferentially
   */
  private calculateLiquidComposition(
    available: OxideComposition,
    eutectic: OxideComposition,
    liquidPercent: number
  ): OxideComposition {
    if (liquidPercent < 0.01) {
      return {};
    }

    const liquid: OxideComposition = {};

    // Liquid composition is enriched in flux oxides (CaO, Fe2O3)
    // and approaches eutectic composition
    // NOT a simple average - selective melting!

    const availableCaO = available.CaO || 0;
    const availableFe2O3 = available.Fe2O3 || 0;
    const availableAl2O3 = available.Al2O3 || 0;
    const availableSiO2 = available.SiO2 || 0;

    // Flux enrichment factor (liquid is richer in fluxes than bulk)
    const fluxEnrichment = 2.0; // Liquid has 2x the flux content
    const refractoryDepletion = 0.85; // Liquid has less refractory oxides

    // Start with eutectic as target
    const targetCaO = eutectic.CaO || 28.4;
    const targetAl2O3 = eutectic.Al2O3 || 36.8;
    const targetSiO2 = eutectic.SiO2 || 34.8;

    // Blend toward eutectic, enriching fluxes
    const blendFactor = Math.min(liquidPercent / 100, 0.6);

    liquid.CaO = Math.min(
      availableCaO * fluxEnrichment,
      availableCaO * (1 - blendFactor) + targetCaO * blendFactor * 1.2
    );

    liquid.Fe2O3 = availableFe2O3 * fluxEnrichment * (1 - blendFactor * 0.5);

    liquid.Al2O3 = Math.max(
      availableAl2O3 * refractoryDepletion,
      availableAl2O3 * (1 - blendFactor) + targetAl2O3 * blendFactor * 0.9
    );

    liquid.SiO2 = Math.max(
      availableSiO2 * refractoryDepletion,
      availableSiO2 * (1 - blendFactor) + targetSiO2 * blendFactor
    );

    // Add minor oxides
    if (available.MgO) liquid.MgO = available.MgO * 0.8;
    if (available.TiO2) liquid.TiO2 = available.TiO2 * 1.2;
    if (available.K2O) liquid.K2O = available.K2O * 1.5;
    if (available.Na2O) liquid.Na2O = available.Na2O * 1.5;

    return this.normalizeComposition(liquid);
  }

  /**
   * Calculate solid composition - enriched in refractory oxides
   */
  private calculateSolidComposition(
    available: OxideComposition,
    liquid: OxideComposition,
    liquidPercent: number,
    solidPercent: number
  ): OxideComposition {
    if (solidPercent < 0.01) {
      return {}; // No solid phase
    }

    const solid: OxideComposition = {};

    // Mass balance: solid contains what didn't melt
    // Enriched in Al2O3, SiO2 (refractory oxides)
    // Depleted in CaO, Fe2O3 (fluxes)

    for (const oxide in available) {
      const totalOxide = available[oxide] || 0;
      const liquidOxide = (liquid[oxide] || 0) * (liquidPercent / 100);
      let solidOxide = totalOxide - liquidOxide;

      // Ensure solid is enriched in refractories
      if (oxide === 'Al2O3' || oxide === 'SiO2') {
        // High-melting oxides prefer solid phase
        solidOxide = Math.max(solidOxide, totalOxide * 0.95);
      }

      if (oxide === 'CaO' || oxide === 'Fe2O3') {
        // Low-melting oxides prefer liquid phase
        solidOxide = Math.min(solidOxide, totalOxide * 0.4);
      }

      solid[oxide] = Math.max(0, solidOxide / (solidPercent / 100));
    }

    return this.normalizeComposition(solid);
  }

  /**
   * Normalize composition to sum to 100%
   */
  private normalizeComposition(composition: OxideComposition): OxideComposition {
    const sum: number = Object.values(composition).reduce((acc: number, val) => acc + (val || 0), 0);

    if (sum === 0) return composition;

    const normalized: OxideComposition = {};
    for (const [oxide, value] of Object.entries(composition)) {
      if (value !== undefined) {
        normalized[oxide] = (value / sum) * 100;
      }
    }

    return normalized;
  }

  protected calculate(): any {
    throw new Error('Use calculateLiquidSolidSplit');
  }
}

