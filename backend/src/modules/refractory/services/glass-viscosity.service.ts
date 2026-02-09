import { Injectable, BadRequestException } from '@nestjs/common';
import { getComponentEffect } from '../data/component-properties';
import {
  GlassViscosityResult,
  ModelInfo,
  FixedPoints,
  ValidationStatus,
  ComponentBreakdown,
  ComponentEffect,
  CompositionIssue,
  GlassViscosityMetadata,
} from '../interfaces/glass-viscosity.interface';
import {
  ViscosityModel,
  ViscosityModelNames,
  ViscosityModelType,
  ConfidenceLevel,
  ExtrapolationRisk,
} from '../enums/viscosity-model.enum';
import { VISCOSITY_PARAMETERS } from '../constants/viscosity-parameters';
import { ViscosityParameters } from '../interfaces/viscosity-parameters.interface';

/**
 * Glass Viscosity Calculator Service
 *
 * Implements composition-dependent viscosity models for glass and slag systems
 * with analytical/numerical methods for calculating ASTM C965-96 fixed points.
 *
 * **Version 2.0 - Composition-Dependent Models**
 *
 * Features:
 * - Automatic glass system detection (9 system types)
 * - System-specific VFT and Arrhenius models
 * - Analytical calculation of fixed points
 * - Composition validation with confidence levels
 * - Support for all 33 components
 *
 * Models:
 * - VFT: log₁₀(η) = A + B/(T - T₀)
 * - Arrhenius: ln(η) = A + B/T
 *
 * References:
 * - ASTM C965-96: Standard Practice for Measuring Viscosity of Glass Above the Softening Point
 * - Lakatos et al. (1972): Viscosity temperature relations in the glass system SiO₂-Al₂O₃-Na₂O-K₂O-CaO-MgO
 * - Giordano et al. (2008): Viscosity of magmatic liquids: A model, Earth Planet. Sci. Lett.
 * - Dingwell et al. (1992): Chemical Geology 95(3-4):229-237
 * - Mazurin & Gankin (1983): Handbook of Glass Data
 *
 * ASTM C965-96 Fixed Points (Note: ASTM defines in poise. Conversion: 1 Pa·s = 10 poise):
 * - Melting Point: 10 poise = 1 Pa·s - liquid, homogenization
 * - Flow Point: 10⁵ poise = 10⁴ Pa·s - upper working limit
 * - Working Point: 10⁴ poise = 10³ Pa·s - glass working temperature
 * - Softening Point: 10^7.6 poise = 10^6.6 Pa·s - Littleton softening point
 * - Annealing Point: 10^13 poise = 10^12 Pa·s - upper glass transition
 * - Strain Point: 10^14.5 poise = 10^13.5 Pa·s - lower glass transition
 *
 * Date: February 8, 2026
 */
@Injectable()
export class GlassViscosityService {
  private readonly VERSION = '2.0.0';

  /**
   * Calculate glass viscosity using composition-dependent models
   *
   * This is the main entry point for the service. It:
   * 1. Normalizes the composition
   * 2. Detects the appropriate glass system
   * 3. Validates composition against model ranges
   * 4. Calculates viscosity using system-specific parameters
   * 5. Calculates all ASTM fixed points
   * 6. Returns comprehensive result with metadata
   *
   * @param composition Record with component formulas as keys and weight percentages as values
   * @param temperature Temperature in °C
   * @returns Complete viscosity result with fixed points and validation
   */
  calculateViscosity(composition: Record<string, number>, temperature: number): GlassViscosityResult {
    // Step 1: Normalize composition to sum to 100%
    const normalizedComp = this.normalizeComposition(composition);

    // Step 2: Detect glass system type
    const modelType = this.detectViscosityModel(normalizedComp);

    // Step 3: Get model parameters
    const params = VISCOSITY_PARAMETERS[modelType];

    // Step 4: Validate composition against model ranges
    const validation = this.validateComposition(normalizedComp, modelType, params);

    // Step 5: Calculate B parameter using composition-specific effects
    const B = this.calculateBParameter(normalizedComp, params);

    // Step 6: Calculate viscosity
    const T_K = temperature + 273.15;
    let viscosity: number;
    let logViscosity: number;

    if (params.modelType === ViscosityModelType.VFT) {
      // VFT model: log10(η) = A + B/(T - T0)
      if (!params.T0) {
        throw new Error(`VFT model requires T0 parameter for ${modelType}`);
      }
      logViscosity = params.A + B / (T_K - params.T0);
      viscosity = Math.pow(10, logViscosity);
    } else {
      // Arrhenius model: ln(η) = A + B/T
      const lnViscosity = params.A + B / T_K;
      viscosity = Math.exp(lnViscosity);
      logViscosity = Math.log10(viscosity);
    }

    // Step 7: Clamp to physical range
    viscosity = Math.max(0.001, Math.min(1e15, viscosity));
    logViscosity = Math.log10(viscosity);

    // Step 8: Calculate fixed points
    const fixedPoints = this.calculateFixedPoints(params, B);

    // Step 9: Build component breakdown
    const components = this.buildComponentBreakdown(normalizedComp);

    // Step 10: Create model info
    const modelInfo: ModelInfo = {
      type: params.modelType,
      systemType: modelType,
      systemName: ViscosityModelNames[modelType],
      parameters: {
        A: params.A,
        B: B,
        T0: params.T0,
        temperatureRange: {
          min_C: params.temperatureRange.min,
          max_C: params.temperatureRange.max,
        },
      },
    };

    // Step 11: Create metadata
    const metadata: GlassViscosityMetadata = {
      calculatedAt: new Date(),
      modelType: params.modelType,
      standard: 'ASTM_C965_96',
      confidence: validation.confidenceLevel,
      reference: params.reference,
      version: this.VERSION,
    };

    // Step 12: Return comprehensive result
    return {
      viscosity_Pas: Number(viscosity.toFixed(3)),
      temperature_C: temperature,
      logViscosity: Number(logViscosity.toFixed(2)),
      model: modelInfo,
      fixedPoints,
      validation,
      components,
      composition: normalizedComp,
      metadata,
    };
  }


  /**
   * Normalize composition to sum to 100%
   */
  private normalizeComposition(composition: Record<string, number>): Record<string, number> {
    const total = Object.values(composition).reduce((sum, val) => sum + (val || 0), 0);

    if (total === 0) {
      throw new BadRequestException('Composition cannot be empty or all zeros');
    }

    // If already close to 100%, don't normalize
    if (Math.abs(total - 100) < 0.01) {
      return composition;
    }

    // Normalize to 100%
    const normalized: Record<string, number> = {};
    for (const [component, value] of Object.entries(composition)) {
      if (value && value > 0) {
        normalized[component] = (value / total) * 100;
      }
    }

    return normalized;
  }

  /**
   * Detect glass system type based on composition
   *
   * Detection order (most specific first):
   * 1. Pure/binary systems
   * 2. Specialty systems (lead, fluoride)
   * 3. Commercial systems (borosilicate, aluminosilicate)
   * 4. Slags
   * 5. Default (soda-lime-silica or multi-component)
   */
  private detectViscosityModel(comp: Record<string, number>): ViscosityModel {
    // Extract major components
    const SiO2 = comp.SiO2 || 0;
    const Al2O3 = comp.Al2O3 || 0;
    const B2O3 = comp.B2O3 || 0;
    const Na2O = comp.Na2O || 0;
    const K2O = comp.K2O || 0;
    const CaO = comp.CaO || 0;
    const MgO = comp.MgO || 0;
    const PbO = comp.PbO || 0;
    const FeO = (comp.FeO || 0) + (comp.Fe2O3 || 0);

    // Calculate totals
    const alkali = Na2O + K2O + (comp.Li2O || 0);
    const alkalineEarth = CaO + MgO + (comp.BaO || 0) + (comp.SrO || 0);
    const fluorides = (comp.CaF2 || 0) + (comp.NaF || 0) + (comp.KF || 0) +
                      (comp.MgF2 || 0) + (comp.AlF3 || 0) + (comp.LiF || 0);

    // 1. Pure silica (>99% SiO2)
    if (SiO2 > 99) {
      return ViscosityModel.PURE_SILICA;
    }

    // 2. Lead glass (PbO > 15%)
    if (PbO > 15) {
      return ViscosityModel.LEAD_GLASS;
    }

    // 3. Fluoride glass (fluorides > 20%)
    if (fluorides > 20) {
      return ViscosityModel.FLUORIDE_GLASS;
    }

    // 4. Borosilicate (B2O3 > 7%, SiO2 > 70%, low alkali)
    if (B2O3 > 7 && SiO2 > 70 && alkali < 10) {
      return ViscosityModel.BOROSILICATE;
    }

    // 5. High-alumina (Al2O3 > 12%, SiO2 50-70%)
    if (Al2O3 > 12 && SiO2 >= 50 && SiO2 <= 70) {
      return ViscosityModel.ALUMINOSILICATE;
    }

    // 6. Calcium-aluminate slag (CaO > 30%, SiO2 < 50%)
    if (CaO > 30 && SiO2 < 50) {
      return ViscosityModel.SLAG_CAO_AL2O3;
    }

    // 7. Sodium silicate binary (SiO2 > 60%, Na2O > 18%, minimal other components)
    if (SiO2 > 60 && Na2O > 18 && (Al2O3 + CaO + MgO + K2O + B2O3) < 5) {
      return ViscosityModel.SODIUM_SILICATE;
    }

    // 8. Soda-lime-silica (65-80% SiO2, 8-20% alkali, 3-20% alkaline earth)
    if (SiO2 >= 65 && SiO2 <= 80 && alkali >= 8 && alkali <= 20 && alkalineEarth >= 3) {
      return ViscosityModel.SODA_LIME_SILICA;
    }

    // 9. Multi-component (fallback for complex compositions)
    return ViscosityModel.MULTI_COMPONENT_MIXING;
  }

  /**
   * Validate composition against model ranges
   */
  private validateComposition(
    comp: Record<string, number>,
    modelType: ViscosityModel,
    _params: ViscosityParameters
  ): ValidationStatus {
    const warnings: string[] = [];
    const compositionIssues: CompositionIssue[] = [];
    let confidenceLevel: ConfidenceLevel = ConfidenceLevel.HIGH;
    let extrapolationRisk: ExtrapolationRisk = ExtrapolationRisk.NONE;
    let componentsInRange: number;
    let componentsOutOfRange = 0;

    // Check ranges based on model type
    switch (modelType) {
      case ViscosityModel.SODA_LIME_SILICA:
        this.validateSodaLimeSilica(comp, warnings, compositionIssues);
        break;

      case ViscosityModel.BOROSILICATE:
        this.validateBorosilicate(comp, warnings, compositionIssues);
        break;

      case ViscosityModel.ALUMINOSILICATE:
        this.validateAluminosilicate(comp, warnings, compositionIssues);
        break;

      case ViscosityModel.MULTI_COMPONENT_MIXING:
        warnings.push('Composition does not match any validated system. Using mixing model with low confidence.');
        confidenceLevel = ConfidenceLevel.LOW;
        extrapolationRisk = ExtrapolationRisk.SEVERE;
        break;
    }

    // Count components in/out of range
    for (const issue of compositionIssues) {
      if (issue.severity === 'WARNING') {
        componentsOutOfRange++;
      }
    }
    componentsInRange = Object.keys(comp).length - componentsOutOfRange;

    // Determine overall confidence level based on issues
    if (compositionIssues.length > 0) {
      const hasErrors = compositionIssues.some(i => i.severity === 'ERROR');
      if (hasErrors) {
        confidenceLevel = ConfidenceLevel.LOW;
        extrapolationRisk = ExtrapolationRisk.SEVERE;
      } else if (compositionIssues.length > 2) {
        confidenceLevel = ConfidenceLevel.MEDIUM;
        extrapolationRisk = ExtrapolationRisk.MODERATE;
      } else {
        confidenceLevel = ConfidenceLevel.MEDIUM;
        extrapolationRisk = ExtrapolationRisk.MINOR;
      }
    }

    return {
      systemDetected: ViscosityModelNames[modelType],
      confidenceLevel,
      warnings,
      componentsInRange,
      componentsOutOfRange,
      extrapolationRisk,
      compositionIssues,
    };
  }

  /**
   * Validate soda-lime-silica composition
   */
  private validateSodaLimeSilica(
    comp: Record<string, number>,
    warnings: string[],
    issues: CompositionIssue[]
  ): void {
    const SiO2 = comp.SiO2 || 0;
    const alkali = (comp.Na2O || 0) + (comp.K2O || 0);
    const alkalineEarth = (comp.CaO || 0) + (comp.MgO || 0);

    if (SiO2 < 65 || SiO2 > 80) {
      warnings.push(`SiO2 content (${SiO2.toFixed(1)}%) outside validated range (65-80%)`);
      issues.push({
        component: 'SiO2',
        actualValue: SiO2,
        validRange: { min: 65, max: 80 },
        severity: 'WARNING',
        impact: 'Reduced model accuracy',
      });
    }

    if (alkali < 10 || alkali > 18) {
      warnings.push(`Alkali content (${alkali.toFixed(1)}%) outside validated range (10-18%)`);
      issues.push({
        component: 'Na2O+K2O',
        actualValue: alkali,
        validRange: { min: 10, max: 18 },
        severity: 'WARNING',
        impact: 'Reduced model accuracy',
      });
    }
  }

  /**
   * Validate borosilicate composition
   */
  private validateBorosilicate(
    comp: Record<string, number>,
    warnings: string[],
    issues: CompositionIssue[]
  ): void {
    const B2O3 = comp.B2O3 || 0;
    const SiO2 = comp.SiO2 || 0;
    const alkali = (comp.Na2O || 0) + (comp.K2O || 0);

    if (B2O3 < 8 || B2O3 > 15) {
      warnings.push(`B2O3 content (${B2O3.toFixed(1)}%) outside validated range (8-15%)`);
    }

    // Check for boron anomaly
    if (B2O3 > 0) {
      const R_molar = (alkali / 62) / (B2O3 / 69.6); // Approximate molar ratio
      if (R_molar > 0.3 && R_molar < 1.2) {
        warnings.push(`Composition in boron anomaly region (R = ${R_molar.toFixed(2)}). Model accuracy reduced.`);
        issues.push({
          component: 'B2O3/Alkali ratio',
          actualValue: R_molar,
          validRange: { min: 0, max: 0.3 },
          severity: 'WARNING',
          impact: 'Boron anomaly affects viscosity behavior',
        });
      }
    }
  }

  /**
   * Validate aluminosilicate composition
   */
  private validateAluminosilicate(
    comp: Record<string, number>,
    warnings: string[],
    issues: CompositionIssue[]
  ): void {
    const Al2O3 = comp.Al2O3 || 0;

    if (Al2O3 < 15 || Al2O3 > 30) {
      warnings.push(`Al2O3 content (${Al2O3.toFixed(1)}%) outside validated range (15-30%)`);
    }
  }

  /**
   * Calculate B parameter using composition-specific effects
   */
  private calculateBParameter(
    comp: Record<string, number>,
    params: ViscosityParameters
  ): number {
    let B = params.B;

    // If model has component-specific effects, use them
    if (params.componentEffects && params.componentEffects.length > 0) {
      for (const effect of params.componentEffects) {
        const componentValue = comp[effect.component] || 0;
        if (componentValue > 0) {
          // Use average effect for now (could be refined with composition)
          const avgEffect = (effect.effectMin + effect.effectMax) / 2;
          B += componentValue * avgEffect;
        }
      }
    }

    return B;
  }

  /**
   * Calculate all ASTM C965-96 fixed points analytically
   */
  private calculateFixedPoints(params: ViscosityParameters, B: number): FixedPoints {
    // Target viscosities for each fixed point (Pa·s)
    const targets = {
      melting: 1,                    // 10^0 Pa·s
      flow: 1e4,                     // 10^4 Pa·s
      working: 1e3,                  // 10^3 Pa·s
      softening: Math.pow(10, 6.6),  // 10^6.6 Pa·s
      annealing: 1e12,               // 10^12 Pa·s
      strain: Math.pow(10, 13.5),    // 10^13.5 Pa·s
    };

    const points: FixedPoints = {
      meltingPoint_C: this.calculateTemperatureForViscosity(targets.melting, params, B),
      flowPoint_C: this.calculateTemperatureForViscosity(targets.flow, params, B),
      workingPoint_C: this.calculateTemperatureForViscosity(targets.working, params, B),
      softeningPoint_C: this.calculateTemperatureForViscosity(targets.softening, params, B),
      annealingPoint_C: this.calculateTemperatureForViscosity(targets.annealing, params, B),
      strainPoint_C: this.calculateTemperatureForViscosity(targets.strain, params, B),
    };

    // Calculate spans
    points.spans = {
      meltingToStrain_C: points.meltingPoint_C - points.strainPoint_C,
      workingToSoftening_C: points.workingPoint_C - points.softeningPoint_C,
      softeningToAnnealing_C: points.softeningPoint_C - points.annealingPoint_C,
      annealingToStrain_C: points.annealingPoint_C - points.strainPoint_C,
    };

    return points;
  }

  /**
   * Calculate temperature for a target viscosity (inverse problem)
   */
  private calculateTemperatureForViscosity(
    targetViscosity: number,
    params: ViscosityParameters,
    B: number
  ): number {
    if (params.modelType === ViscosityModelType.VFT) {
      // VFT: log₁₀(η) = A + B/(T - T₀)
      // Rearrange: T = T₀ + B/(log₁₀(η) - A)
      const logEta = Math.log10(targetViscosity);
      const T_K = params.T0! + B / (logEta - params.A);
      return T_K - 273.15; // Convert to Celsius
    } else {
      // Arrhenius: ln(η) = A + B/T
      // Rearrange: T = B/(ln(η) - A)
      const lnEta = Math.log(targetViscosity);
      const T_K = B / (lnEta - params.A);
      return T_K - 273.15; // Convert to Celsius
    }
  }

  /**
   * Build component breakdown for result
   */
  private buildComponentBreakdown(comp: Record<string, number>): ComponentBreakdown {
    const networkFormers: ComponentEffect[] = [];
    const networkModifiers: ComponentEffect[] = [];
    const fluorides: ComponentEffect[] = [];
    const chlorides: ComponentEffect[] = [];

    const formersList = ['SiO2', 'Al2O3', 'Cr2O3', 'ZrO2', 'TiO2', 'B2O3', 'GeO2'];
    const modifiersList = ['Na2O', 'K2O', 'Li2O', 'PbO', 'CaO', 'BaO', 'SrO', 'MnO', 'FeO', 'Fe2O3', 'CoO', 'NiO', 'CuO', 'MgO'];
    const fluoridesList = ['NaF', 'KF', 'LiF', 'CaF2', 'MgF2', 'AlF3'];
    const chloridesList = ['NaCl', 'KCl', 'CaCl2', 'MgCl2', 'FeCl2', 'FeCl3'];

    for (const [component, percentage] of Object.entries(comp)) {
      if (percentage > 0) {
        const effect = getComponentEffect(component)?.viscosityEffect || 0;
        const entry: ComponentEffect = { component, percentage, effect };

        if (formersList.includes(component)) {
          networkFormers.push(entry);
        } else if (modifiersList.includes(component)) {
          networkModifiers.push(entry);
        } else if (fluoridesList.includes(component)) {
          fluorides.push(entry);
        } else if (chloridesList.includes(component)) {
          chlorides.push(entry);
        }
      }
    }

    return { networkFormers, networkModifiers, fluorides, chlorides };
  }
}

