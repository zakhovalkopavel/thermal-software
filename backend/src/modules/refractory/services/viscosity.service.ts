import { Injectable } from '@nestjs/common';
import {
  calculateViscosityEffect,
} from '../data/component-properties';
import {
  ViscosityInput,
  ViscosityResult,
  ViscosityMetadata,
} from '../interfaces/viscosity.interface';

/**
 * Viscosity Calculator Service
 * Ported from: legacy/refractory/src/calculators/ViscosityCalculator.ts (84 lines)
 *
 * Calculates liquid phase viscosity using Arrhenius model with comprehensive oxide,
 * fluoride, and chloride component effects.
 *
 * Model: η = A × exp(B/T)
 * where:
 * - η: viscosity (Pa·s)
 * - A: pre-exponential factor (composition-dependent)
 * - B: activation energy/R (composition-dependent)
 * - T: absolute temperature (K)
 *
 * ============================================================
 * OXIDE COMPONENTS (Primary Refractory Materials)
 * ============================================================
 * Network Formers (INCREASE viscosity - stronger bonds):
 * - SiO2: +3000 K (moderate network former, very common)
 * - Al2O3: +5000 K (strong network former, high viscosity effect)
 * - B2O3: +2500 K (borate network former)
 * - GeO2: +3500 K (germanium oxide, similar to SiO2)
 * - TiO2: +1500 K (mild network former)
 * - ZrO2: +2000 K (zirconia network former)
 * - Cr2O3: +1800 K (chromium oxide)
 *
 * Network Modifiers (DECREASE viscosity - break network bonds):
 * - CaO: -4000 K (strong flux, breaks Si-O-Si bonds)
 * - MgO: -3500 K (magnesium modifier, moderate flux)
 * - FeO: -3000 K (iron(II) modifier, divalent)
 * - Fe2O3: -3000 K (iron(III) modifier)
 * - Na2O: -5500 K (very strong flux, highly depolymerizing)
 * - K2O: -5000 K (potassium oxide, strong flux)
 * - Li2O: -6000 K (lithium, strongest flux)
 * - PbO: -4500 K (lead oxide, strong modifier)
 * - BaO: -3800 K (barium oxide)
 * - SrO: -3600 K (strontium oxide)
 * - MnO: -3200 K (manganese(II) oxide)
 * - CoO: -2800 K (cobalt oxide)
 * - NiO: -2600 K (nickel oxide)
 * - CuO: -2400 K (copper oxide)
 *
 * Amphoteric Components (Variable Effect - depends on composition):
 * - Amphoteric at different compositions
 * - Can act as network former or modifier
 *
 * ============================================================
 * FLUORIDE COMPONENTS (Flux/Glass Additives)
 * ============================================================
 * - CaF2: -3500 K (calcium fluoride, strong flux similar to CaO)
 * - NaF: -5200 K (sodium fluoride, very strong flux)
 * - KF: -4800 K (potassium fluoride, strong flux)
 * - MgF2: -3200 K (magnesium fluoride, moderate flux)
 * - AlF3: -2500 K (aluminum fluoride, mild flux)
 * - LiF: -5500 K (lithium fluoride, strong flux)
 *
 * ============================================================
 * CHLORIDE COMPONENTS (Halide Additives - Less Common)
 * ============================================================
 * - CaCl2: -3200 K (calcium chloride, moderate flux)
 * - NaCl: -4800 K (sodium chloride, strong flux)
 * - KCl: -4500 K (potassium chloride, strong flux)
 * - MgCl2: -2800 K (magnesium chloride, mild flux)
 * - FeCl2: -2600 K (iron(II) chloride, mild flux)
 * - FeCl3: -2400 K (iron(III) chloride, mild flux)
 *
 * References:
 * - Urbain et al. (1982): Viscosity of silicate melts
 * - Giordano et al. (2008): VFT model for magmatic liquids
 * - Mills (1993): Slag Atlas - viscosity data
 * - Dingwell & Webb (1990): Relaxation in silicate melts
 * - Richet et al. (1996): Viscosity and configurational entropy
 */
@Injectable()
@Injectable()
export class ViscosityService {
  // Base parameters
  private readonly A_BASE = 0.001; // Base pre-exponential factor
  private readonly B_BASE = 10000; // Base activation energy/R (K)

  /**
   * Calculate viscosity with comprehensive component support
   *
   * Uses Arrhenius model: η = A × exp(B/T)
   * where:
   * - η: viscosity (Pa·s)
   * - A: pre-exponential factor (composition-dependent)
   * - B: activation energy/R (composition-dependent, from component-properties.ts)
   * - T: absolute temperature (K)
   *
   * @param liquidComposition Record with oxide/fluoride/chloride components (wt%)
   * @param temperature Temperature in °C
   * @returns Viscosity data including Pa·s, arrhenius parameters, and log viscosity
   */
  calculateViscosity(liquidComposition: Record<string, number>, temperature: number) {
    const T_kelvin = temperature + 273.15;

    let A = this.A_BASE;
    let B = this.B_BASE;

    // Use helper function to calculate viscosity effect from all 33 components at once
    // This automatically loops through composition and applies viscosity effects
    const effectFromComponents = calculateViscosityEffect(liquidComposition);
    B += effectFromComponents;

    // Calculate viscosity using Arrhenius equation
    let viscosity = A * Math.exp(B / T_kelvin);

    // Clamp viscosity to physically meaningful range
    viscosity = Math.max(0.001, Math.min(1e10, viscosity));

    return {
      viscosity_Pas: Number(viscosity.toFixed(3)),
      temperature_C: temperature,
      arrhenius_A: A,
      arrhenius_B: B,
      logViscosity: Math.log10(viscosity),
      components: {
        oxides: this.extractOxideComponents(liquidComposition),
        fluorides: this.extractFluorideComponents(liquidComposition),
        chlorides: this.extractChlorideComponents(liquidComposition),
      },
    };
  }

  /**
   * Extract and list oxide components with their concentrations
   */
  private extractOxideComponents(
    composition: Record<string, number>,
  ): Record<string, number> {
    const oxides = {
      SiO2: composition.SiO2,
      Al2O3: composition.Al2O3,
      B2O3: composition.B2O3,
      CaO: composition.CaO,
      MgO: composition.MgO,
      Na2O: composition.Na2O,
      K2O: composition.K2O,
      Fe2O3: composition.Fe2O3,
      FeO: composition.FeO,
      TiO2: composition.TiO2,
      ZrO2: composition.ZrO2,
      Cr2O3: composition.Cr2O3,
      GeO2: composition.GeO2,
      Li2O: composition.Li2O,
      PbO: composition.PbO,
      BaO: composition.BaO,
      SrO: composition.SrO,
      MnO: composition.MnO,
      CoO: composition.CoO,
      NiO: composition.NiO,
      CuO: composition.CuO,
    };
    // Return only non-zero components
    return Object.entries(oxides)
      .filter(([_, value]) => value)
      .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});
  }

  /**
   * Extract and list fluoride components with their concentrations
   */
  private extractFluorideComponents(
    composition: Record<string, number>,
  ): Record<string, number> {
    const fluorides = {
      CaF2: composition.CaF2,
      NaF: composition.NaF,
      KF: composition.KF,
      MgF2: composition.MgF2,
      AlF3: composition.AlF3,
      LiF: composition.LiF,
    };
    // Return only non-zero components
    return Object.entries(fluorides)
      .filter(([_, value]) => value)
      .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});
  }

  /**
   * Extract and list chloride components with their concentrations
   */
  private extractChlorideComponents(
    composition: Record<string, number>,
  ): Record<string, number> {
    const chlorides = {
      CaCl2: composition.CaCl2,
      NaCl: composition.NaCl,
      KCl: composition.KCl,
      MgCl2: composition.MgCl2,
      FeCl2: composition.FeCl2,
      FeCl3: composition.FeCl3,
    };
    // Return only non-zero components
    return Object.entries(chlorides)
      .filter(([_, value]) => value)
      .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});
  }
}


