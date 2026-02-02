import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import {
  GAS_CONSTANT,
  ABSOLUTE_ZERO_OFFSET,
  BASE_REFRACTORINESS_C,
  MIN_TEMPERATURE_C,
  MAX_TEMPERATURE_C,
} from '../constants/calculation-constants';
import {
  PhaseEquilibriumInput,
  PhaseEquilibriumResult,
  PhaseData,
  SolidPhaseData,
  MineralPhase,
} from '../interfaces/phase-equilibrium.interface';
import {
  calculateLiquidusEffect,
  calculateLiquidCompositionWithEnrichment,
  calculateSolidCompositionWithEnrichment,
} from '../data/component-properties';

/**
 * Phase Equilibrium Calculator Service
 * Ported from: legacy/refractory/src/calculators/PhaseEquilibriumCalculator.ts (276 lines)
 *
 * Calculates liquid-solid phase distribution at temperature based on oxide composition.
 * Supports 33 components (21 oxides + 6 fluorides + 6 chlorides) with individual melting points.
 * Uses CAS ternary system (CaO-Al2O3-SiO2) approximation with anorthite-gehlenite eutectic.
 *
 * References:
 * - Kingery et al. (1976): Introduction to Ceramics, 2nd ed., Wiley
 * - Levin et al. (1964): Phase Diagrams for Ceramists, ACerS
 * - Nurse et al. (1965): J. Am. Ceram. Soc. 48(8), 439-442 (CaO-Al₂O₃-SiO₂ system)
 * - Osborn & Muan (1960): Revised Phase Equilibrium Diagrams
 * - NIST Phase Diagram Database
 *
 * Key Features:
 * - Selective melting model (flux enrichment) - 33 components
 * - Non-linear liquid formation kinetics (power law)
 * - Mineral phase identification (Mullite, Corundum, Anorthite, Gehlenite, Spinel, Forsterite)
 * - Component-specific melting points and liquidus effects
 * - CAS eutectic temperature: 1265°C
 *
 * ============================================================
 * COMPONENT MELTING POINTS & LIQUIDUS EFFECTS
 * ============================================================
 * High-melting oxides (increase liquidus):
 * - Al2O3: 2072°C (+1000 K contribution)
 * - SiO2: 1710°C (+800 K)
 * - Cr2O3: 2330°C (+1200 K)
 * - ZrO2: 2715°C (+1400 K)
 * - TiO2: 1843°C (+400 K)
 * - MgO: 2852°C (+800 K)
 * - B2O3: 450°C (-2000 K - strong flux!)
 *
 * Flux oxides (decrease liquidus):
 * - CaO: 2613°C but lowers liquidus due to CaO-SiO2 eutectic
 * - Na2O: 1275°C (-1500 K - strong flux)
 * - K2O: 740°C (-1400 K - strong flux)
 * - Li2O: 1438°C (-1300 K - strong flux)
 * - PbO: 888°C (-1800 K - very strong flux)
 * - FeO: 1377°C (-400 K - moderate flux)
 * - Fe2O3: 1565°C (-300 K - mild flux)
 */
@Injectable()
export class PhaseEquilibriumService {
  private readonly logger = new Logger(PhaseEquilibriumService.name);
  private readonly MIN_TEMPERATURE = MIN_TEMPERATURE_C;
  private readonly MAX_TEMPERATURE = MAX_TEMPERATURE_C;
  private readonly EUTECTIC_TEMP = 1265;
  private readonly EUTECTIC_COMPOSITION = { SiO2: 34.8, Al2O3: 36.8, CaO: 28.4 };

  // Using shared liquidus effects from component-properties.ts - no private constants needed

  calculatePhaseEquilibrium(data: { composition: Record<string, number>; temperature: number; totalMass?: number; }) {
    const { composition, temperature, totalMass = 100 } = data;
    this.validateComposition(composition);
    this.validateTemperature(temperature);
    const warnings: string[] = [];
    const liquidPercent = this.calculateLiquidFraction(composition, temperature, warnings);
    const solidPercent = 100 - liquidPercent;
    const liquidComposition = this.calculateLiquidComposition(composition, liquidPercent);
    const solidComposition = this.calculateSolidComposition(composition, liquidComposition, liquidPercent, solidPercent);
    const mineralPhases = this.identifyMineralPhases(solidComposition);
    const estimatedLiquidus = this.estimateLiquidus(composition);
    this.logger.log(`Phase equilibrium: ${liquidPercent.toFixed(1)}% liquid at ${temperature}°C`);
    return {
      liquid: {
        percent: Number(liquidPercent.toFixed(2)),
        mass: Number(((liquidPercent / 100) * totalMass).toFixed(2)),
        composition: this.roundComposition(liquidComposition),
        components: this.extractActiveComponents(liquidComposition),
      },
      solid: {
        percent: Number(solidPercent.toFixed(2)),
        mass: Number(((solidPercent / 100) * totalMass).toFixed(2)),
        composition: this.roundComposition(solidComposition),
        mineralPhases,
        components: this.extractActiveComponents(solidComposition),
      },
      metadata: {
        temperature,
        totalMass,
        eutecticTemperature: this.EUTECTIC_TEMP,
        estimatedLiquidus: Number(estimatedLiquidus.toFixed(0)),
        calculatedAt: new Date()
      },
      warnings
    };
  }

  private validateComposition(comp: Record<string, number>): void {
    const total = Object.values(comp).reduce((sum, val) => sum + val, 0);
    if (total < 95 || total > 105) throw new BadRequestException(`Composition must sum to ~100% (got ${total.toFixed(2)}%)`);
  }

  private validateTemperature(temp: number): void {
    if (temp < this.MIN_TEMPERATURE || temp > this.MAX_TEMPERATURE) throw new BadRequestException(`Temperature must be ${this.MIN_TEMPERATURE}-${this.MAX_TEMPERATURE}°C`);
  }

  /**
   * Calculate liquid fraction at given temperature
   *
   * Uses non-linear model to account for:
   * - Kinetic limitations (diffusion-controlled)
   * - Coarse particle size (limited reactive surface)
   * - High refractory content (Al2O3 stays solid)
   *
   * Formula: liquidPercent = ((T - T_eutectic) / (T_liquidus - T_eutectic))^3.0 * 0.4 * 100
   *
   * Power of 3.0: Makes liquid formation slower at lower temperatures (realistic kinetics)
   * Scale factor 0.4: Accounts for kinetic/surface area limitations
   *
   * @param comp Oxide composition (all 33 components)
   * @param temp Temperature in °C
   * @param warnings Array to collect warnings
   * @returns Liquid fraction as percentage (0-100)
   */
  private calculateLiquidFraction(comp: Record<string, number>, temp: number, warnings: string[]): number {
    if (temp <= this.EUTECTIC_TEMP) return 0;
    const liquidus = this.estimateLiquidus(comp);
    if (temp >= liquidus) return 100;
    const tempFraction = (temp - this.EUTECTIC_TEMP) / (liquidus - this.EUTECTIC_TEMP);
    const liquidPercent = Math.min(100, Math.max(0, Math.pow(tempFraction, 3.0) * 0.4 * 100));
    if (liquidPercent > 25 && temp < liquidus - 100) warnings.push(`Significant liquid formation (${liquidPercent.toFixed(1)}%) at ${temp}°C`);
    return liquidPercent;
  }

  /**
   * Estimate liquidus temperature using all 33 components
   *
   * Base: 1400°C
   * Add effects for each oxide/fluoride/chloride component
   * Network formers increase, fluxes decrease
   */
  private estimateLiquidus(comp: Record<string, number>): number {
    let liquidus = BASE_REFRACTORINESS_C;

    // Use helper function to calculate liquidus effect from all 33 components at once
    // This automatically loops through composition and applies effects
    const effectFromComponents = calculateLiquidusEffect(comp);
    liquidus += effectFromComponents;

    return Math.max(1300, Math.min(1900, liquidus));
  }

  /**
   * Calculate liquid composition using selective melting model
   *
   * CaO-rich phases melt preferentially (NOT a simple average!)
   *
   * Liquid composition is enriched in flux oxides (CaO, Fe2O3)
   * and approaches eutectic composition, depleted in refractory oxides (Al2O3, SiO2).
   *
   * Uses liquidEnrichmentFactor from each component in component-properties.ts
   * which automatically applies component-specific enrichment coefficients.
   *
   * @param original Original bulk composition
   * @param liquidPercent Liquid fraction (0-100)
   * @returns Normalized liquid composition
   */
  private calculateLiquidComposition(original: Record<string, number>, liquidPercent: number): Record<string, number> {
    if (liquidPercent < 0.01) return {};
    if (liquidPercent === 100) return { ...original };

    // Use helper to apply enrichment factors from component-properties
    const liquid = calculateLiquidCompositionWithEnrichment(original);

    // Blend factor: approaches eutectic composition as liquid increases
    const blendFactor = Math.min(liquidPercent / 100, 0.6);

    // Blend with eutectic composition for higher liquid fractions
    const eutectic = this.EUTECTIC_COMPOSITION;
    if (blendFactor > 0) {
      if (liquid.CaO) liquid.CaO = liquid.CaO * (1 - blendFactor) + eutectic.CaO * blendFactor * 1.2;
      if (liquid.Al2O3) liquid.Al2O3 = liquid.Al2O3 * (1 - blendFactor) + eutectic.Al2O3 * blendFactor * 0.9;
      if (liquid.SiO2) liquid.SiO2 = liquid.SiO2 * (1 - blendFactor) + eutectic.SiO2 * blendFactor;
    }


    return this.normalizeComposition(liquid);
  }

  /**
   * Calculate solid composition - enriched in refractory oxides
   *
   * Mass balance: solid contains what didn't melt
   * - Enriched in Al2O3, SiO2 (refractory oxides prefer solid phase)
   * - Depleted in CaO, Fe2O3 (fluxes prefer liquid phase)
   * - Fluorides and chlorides almost completely leave solid
   *
   * Uses solidEnrichmentFactor from each component in component-properties.ts
   * which automatically handles component-specific solid retention.
   *
   * @param original Original bulk composition
   * @param liquid Calculated liquid composition
   * @param liquidPercent Liquid fraction
   * @param solidPercent Solid fraction
   * @returns Normalized solid composition
   */
  private calculateSolidComposition(original: Record<string, number>, liquid: Record<string, number>, liquidPercent: number, solidPercent: number): Record<string, number> {
    if (solidPercent < 0.01) return {};
    if (liquidPercent < 0.01) return { ...original };

    // Use helper to apply solid enrichment factors from component-properties
    const solid = calculateSolidCompositionWithEnrichment(original);

    // Normalize to get percentage composition
    const normalized: Record<string, number> = {};
    const sum = Object.values(solid).reduce((acc, val) => acc + val, 0);
    if (sum > 0) {
      for (const [key, value] of Object.entries(solid)) {
        normalized[key] = (value / sum) * 100;
      }
    }

    return normalized;
  }

  private identifyMineralPhases(comp: Record<string, number>): string[] {
    const phases: string[] = [];
    const Al2O3 = comp.Al2O3 || 0, SiO2 = comp.SiO2 || 0, CaO = comp.CaO || 0, MgO = comp.MgO || 0;
    if (Al2O3 > 50) phases.push('Corundum (α-Al₂O₃)');
    if (Al2O3 > 30 && SiO2 > 20 && Al2O3 / SiO2 > 1.5) phases.push('Mullite (3Al₂O₃·2SiO₂)');
    if (CaO > 5 && Al2O3 > 15 && SiO2 > 20) phases.push('Anorthite (CaAl₂Si₂O₈)');
    if (CaO > 15 && Al2O3 > 10 && SiO2 > 5) phases.push('Gehlenite (Ca₂Al₂SiO₇)');
    if (MgO > 10 && Al2O3 > 30) phases.push('Spinel (MgAl₂O₄)');
    if (MgO > 20 && SiO2 > 15) phases.push('Forsterite (Mg₂SiO₄)');
    return phases.length > 0 ? phases : ['Mixed solid solution'];
  }

  private normalizeComposition(comp: Record<string, number>): Record<string, number> {
    const sum = Object.values(comp).reduce((acc, val) => acc + val, 0);
    if (sum === 0) return comp;
    const normalized: Record<string, number> = {};
    for (const [key, value] of Object.entries(comp)) normalized[key] = (value / sum) * 100;
    return normalized;
  }

  private roundComposition(comp: Record<string, number>): Record<string, number> {
    const rounded: Record<string, number> = {};
    for (const [key, value] of Object.entries(comp)) rounded[key] = Number(value.toFixed(2));
    return rounded;
  }

  /**
   * Extract active components (non-zero values)
   */
  private extractActiveComponents(comp: Record<string, number>): Record<string, number> {
    return Object.entries(comp)
      .filter(([_, value]) => value && value > 0.01)
      .reduce((acc, [key, value]) => ({ ...acc, [key]: Number(value.toFixed(2)) }), {});
  }
}

