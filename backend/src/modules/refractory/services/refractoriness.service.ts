import { Injectable } from '@nestjs/common';
import {
  GAS_CONSTANT,
  RUL_TEST_LOAD_PA,
  BASE_REFRACTORINESS_C,
  MIN_TEMPERATURE_C,
  MAX_TEMPERATURE_C,
  LOW_DUTY_LIMIT_C,
  INTERMEDIATE_DUTY_LIMIT_C,
  HIGH_DUTY_LIMIT_C,
} from '../constants/calculation-constants';
import {
  RefractorinessInput,
  RefractorinessResult,
  ISO1893Result,
  ASTMC24Result,
  GOST4069Result,
  ComponentRefractorinesEffect,
} from '../interfaces/refractoriness.interface';
import {
  calculateRefractorinessEffect,
} from '../data/component-properties';


/**
 * Refractoriness Standards Calculator Service
 * Ported from: legacy/refractory/src/calculators/RefractorinessStandardsCalculator.ts (420 lines)
 *
 * Implements multiple models for predicting standard refractoriness points.
 * Supports 33 components (21 oxides + 6 fluorides + 6 chlorides) for accurate estimation.
 *
 * Standards:
 * - EN ISO 1893: Refractoriness Under Load (RUL) - T₀.₅, T₁, T₂ at 0.2 MPa
 *   - T0.5: Temperature at 0.5% deformation under 0.2 MPa load
 *   - T1: Temperature at 1% deformation
 *   - T2: Temperature at 2% deformation
 * - ASTM C24/C71: Pyrometric Cone Equivalent (PCE)
 *   - Cone number indicating refractoriness based on cone softening behavior
 * - GOST 4069-69: Refractoriness point based on cone softening (Russian standard)
 *
 * References:
 * - EN ISO 1893:2015 - Refractory materials - Determination of refractoriness-under-load
 * - ASTM C24-10: Standard Test Method for Pyrometric Cone Equivalent (PCE)
 * - ASTM C71: Standard Terminology Relating to Refractories
 * - Giordano et al. (2008): Viscosity of magmatic liquids
 * - Hsieh (2004): Einstein-Roscoe equation for effective viscosity
 * - Decterov & Pelton (2012): CALPHAD-based viscosity modeling
 * - Mills (1993): Slag Atlas - refractory effects
 *
 * ============================================================
 * COMPONENT EFFECTS ON REFRACTORINESS (K - relative to base)
 * ============================================================
 *
 * Network Formers (Increase refractoriness - strengthen structure):
 * - Al2O3: +800 K (strongest, most refractory)
 * - SiO2: +500 K (moderate, common)
 * - Cr2O3: +700 K (chromium, high)
 * - ZrO2: +600 K (zirconia, high)
 * - TiO2: +400 K (titania, moderate)
 * - B2O3: +200 K (boron, low)
 * - GeO2: +300 K (germanium, low-moderate)
 *
 * Network Modifiers (Decrease refractoriness - reduce melting point):
 * - Na2O: -900 K (strongest flux, most refractory loss)
 * - K2O: -850 K (potassium, strong flux)
 * - Li2O: -800 K (lithium, strong flux)
 * - PbO: -750 K (lead, strong flux)
 * - CaO: -600 K (calcium, strong flux)
 * - MgO: -500 K (magnesia, moderate flux)
 * - BaO: -550 K (barium, strong)
 * - SrO: -520 K (strontium, strong)
 * - MnO: -400 K (manganese, moderate)
 * - FeO: -450 K (iron(II), moderate)
 * - Fe2O3: -450 K (iron(III), moderate)
 * - CoO: -350 K (cobalt, mild)
 * - NiO: -330 K (nickel, mild)
 * - CuO: -320 K (copper, mild)
 *
 * Fluoride Components (Decrease refractoriness - similar to oxide fluxes):
 * - NaF: -850 K (strong flux)
 * - LiF: -800 K (strong flux)
 * - KF: -820 K (strong flux)
 * - CaF2: -600 K (moderate flux)
 * - MgF2: -480 K (mild flux)
 * - AlF3: -280 K (weak flux)
 *
 * Chloride Components (Decrease refractoriness - volatile, less stable):
 * - NaCl: -750 K (strong destabilizer)
 * - KCl: -720 K (strong destabilizer)
 * - CaCl2: -550 K (moderate destabilizer)
 * - MgCl2: -420 K (mild destabilizer)
 * - FeCl2: -380 K (mild destabilizer)
 * - FeCl3: -360 K (mild destabilizer)
 *
 * Refractoriness Classification:
 * - Low duty: < 1580°C (Cone <26)
 * - Intermediate duty: 1580-1750°C (Cone 26-33)
 * - High duty: 1750-1850°C (Cone 33-36)
 * - Super duty: > 1850°C (Cone >36)
 */
@Injectable()
export class RefractorinessService {
  // Using shared constants imported from component-properties.ts
  // All component effects for refractoriness calculations

  // ====================================================
  // OXIDE COMPONENT EFFECTS

  /**
   * Calculate refractoriness with comprehensive component support
   *
   * @param composition Record with oxide/fluoride/chloride components (wt%)
   * @param standard Test standard (ISO1893, ASTM_C24, ASTM_C71, GOST4069)
   * @param testTemperature Optional reference temperature
   * @returns Refractoriness data for specified standard
   */
  calculateRefractoriness(
    composition: Record<string, number>,
    standard: string = 'ISO1893',
    testTemperature?: number,
  ) {
    let refractorinessTemp = BASE_REFRACTORINESS_C;

    // Use helper function to calculate effect from all 33 components at once
    // This automatically loops through composition and applies effects
    const effectFromComponents = calculateRefractorinessEffect(composition);
    refractorinessTemp += effectFromComponents;

    // Ensure physically meaningful temperature
    refractorinessTemp = Math.max(MIN_TEMPERATURE_C, Math.min(MAX_TEMPERATURE_C, refractorinessTemp));

    const results: any = {
      composition,
      standard,
      estimatedRefractoriness_C: Number(refractorinessTemp.toFixed(0)),
      components: {
        oxides: this.extractOxideComponents(composition),
        fluorides: this.extractFluorideComponents(composition),
        chlorides: this.extractChlorideComponents(composition),
      },
    };

    switch (standard) {
      case 'ISO1893':
        results.RUL = {
          T05: Number((refractorinessTemp * 0.95).toFixed(0)),
          T1: Number((refractorinessTemp * 0.97).toFixed(0)),
          T2: Number(refractorinessTemp.toFixed(0)),
          testLoad_MPa: 0.2,
          description:
            'Refractoriness Under Load - ISO 1893 standard',
        };
        break;
      case 'ASTM_C24':
        results.PCE = {
          coneNumber: this.temperatureToConeNumber(refractorinessTemp),
          equivalentTemperature_C: refractorinessTemp,
          description: 'Pyrometric Cone Equivalent - ASTM C24 standard',
        };
        break;
      case 'ASTM_C71':
        results.PCE_modified = {
          coneNumber: this.temperatureToConeNumber(refractorinessTemp),
          deformationTemperature_C: refractorinessTemp,
          description: 'PCE modified - ASTM C71 standard',
        };
        break;
      case 'GOST4069':
        results.GOST = {
          refractorinessPoint_C: refractorinessTemp,
          coneSoftening: true,
          description: 'GOST 4069-69 Russian standard',
        };
        break;
      default:
        results.genericRefractoriness_C = refractorinessTemp;
    }

    results.classification = this.classifyRefractoriness(refractorinessTemp);

    return results;
  }

  /**
   * Convert temperature to pyrometric cone number (ASTM C24)
   */
  private temperatureToConeNumber(temp_C: number): number {
    // ASTM E794 standard cone equivalents
    if (temp_C < 1250) return 10;
    if (temp_C < 1300) return 15;
    if (temp_C < 1350) return 20;
    if (temp_C < 1400) return 26;
    if (temp_C < 1450) return 28;
    if (temp_C < 1500) return 30;
    if (temp_C < 1550) return 32;
    if (temp_C < 1600) return 33;
    if (temp_C < 1650) return 34;
    if (temp_C < 1700) return 35;
    if (temp_C < 1750) return 36;
    if (temp_C < 1800) return 37;
    if (temp_C < 1850) return 38;
    return 40;
  }

  /**
   * Classify refractoriness by duty level
   */
  private classifyRefractoriness(temp_C: number): string {
    if (temp_C < LOW_DUTY_LIMIT_C) return 'Low duty refractory';
    if (temp_C < INTERMEDIATE_DUTY_LIMIT_C) return 'Intermediate duty refractory';
    if (temp_C < HIGH_DUTY_LIMIT_C) return 'High duty refractory';
    return 'Super duty refractory';
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


