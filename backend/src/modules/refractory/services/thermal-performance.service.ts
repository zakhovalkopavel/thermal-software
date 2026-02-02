import { Injectable } from '@nestjs/common';
import {
  ThermalInput,
  ThermalConductivityInput,
  SpecificHeatInput,
  ThermalExpansionInput,
  ThermalConductivityResult,
  SpecificHeatResult,
  ThermalExpansionResult,
  ThermalPerformanceResult,
} from '../interfaces/thermal-performance.interface';
import {
  calculateWeightedThermalConductivity,
  calculateWeightedSpecificHeat,
  extractComponentsByCategory,
} from '../data/component-properties';

/**
 * Thermal Performance Calculator Service
 * Ported from: legacy/refractory/src/calculators/ThermalPerformanceCalculator.ts (126 lines)
 *
 * Calculates thermal conductivity and heat transfer properties for refractory materials.
 * Supports 33 components (21 oxides + 6 fluorides + 6 chlorides) with individual thermal properties.
 *
 * All component thermal properties are centralized in:
 * - data/thermal-component-properties.data.ts
 *
 * This service uses data-driven iteration instead of hardcoded values:
 * - Composition iteration via component properties object
 * - Dynamic weighted average calculations
 * - Automatic component categorization
 *
 * References:
 * - Kingery et al. (1976): "Introduction to Ceramics" - Thermal conductivity of ceramics
 * - Schacht (2004): "Refractories Handbook" - Thermal properties compilation
 * - Maxwell-Eucken equation for porous materials
 * - Material Library (backend/src/modules/refractory/data/materials/)
 *
 * Key Models:
 * - Thermal conductivity: Weighted average by composition with component-specific values
 * - Porosity effect: Maxwell-Eucken equation k_eff = k_solid × (1-P) / (1 + 0.5×P×(k_solid/k_pores - 1))
 * - Temperature dependence: k(T) = k_base × (1 + α×ΔT) where α varies by component
 * - Specific heat: Composition-weighted average with temperature dependence
 */
@Injectable()
export class ThermalPerformanceService {
  // Base thermal properties
  private readonly K_PORES = 0.025; // Air thermal conductivity (W/m·K)
  private readonly BASE_CP = 800; // Base specific heat (J/kg·K)
  private readonly CP_TEMP_COEFF = 0.3; // Temperature coefficient for Cp
  private readonly BASE_DENSITY = 2500; // Base density (kg/m³)
  private readonly TEMP_CONDUCTIVITY_COEFF = -0.0003; // Temperature coefficient for k

  /**
   * Calculate thermal conductivity using data-driven iteration
   *
   * @param composition Record with oxide/fluoride/chloride components (wt%)
   * @param temperature Temperature in °C
   * @param porosity Porosity fraction (0-1), default 0.2 (20%)
   * @returns Thermal properties including conductivity, specific heat, diffusivity
   */
  calculateThermalConductivity(
    composition: Record<string, number>,
    temperature: number,
    porosity: number = 0.2,
  ) {
    // ====================================================
    // CALCULATE BASE CONDUCTIVITY VIA ITERATION
    // ====================================================
    // Uses data-driven approach: iterate through components
    // instead of hardcoded property assignments
    const k_base = calculateWeightedThermalConductivity(composition);

    // ====================================================
    // TEMPERATURE DEPENDENCE
    // ====================================================
    const k_T = k_base * (1 + this.TEMP_CONDUCTIVITY_COEFF * (temperature - 20));

    // ====================================================
    // POROSITY EFFECT (Maxwell-Eucken equation)
    // ====================================================
    const k_solid = k_T;
    const k_effective =
      k_solid * (1 - porosity) /
      (1 + 0.5 * porosity * (k_solid / this.K_PORES - 1));

    // ====================================================
    // SPECIFIC HEAT (J/kg·K)
    // ====================================================
    const cp_base = calculateWeightedSpecificHeat(composition);
    const cp = cp_base + this.CP_TEMP_COEFF * temperature;

    // ====================================================
    // DENSITY (kg/m³)
    // ====================================================
    const rho = this.BASE_DENSITY * (1 - porosity);

    // ====================================================
    // THERMAL DIFFUSIVITY (m²/s)
    // ====================================================
    const alphaThermal = k_effective / (rho * cp);

    // ====================================================
    // COMPONENT BREAKDOWN
    // ====================================================
    const componentsByCategory = extractComponentsByCategory(composition);

    return {
      thermalConductivity_WmK: Number(k_effective.toFixed(3)),
      specificHeat_JkgK: Number(cp.toFixed(1)),
      density_kgm3: Number(rho.toFixed(0)),
      thermalDiffusivity_m2s: Number(alphaThermal.toExponential(3)),
      temperature_C: temperature,
      porosity,
      components: {
        oxideFormers: componentsByCategory.oxideFormers,
        oxideModifiers: componentsByCategory.oxideModifiers,
        fluorides: componentsByCategory.fluorides,
        chlorides: componentsByCategory.chlorides,
      },
    };
  }


