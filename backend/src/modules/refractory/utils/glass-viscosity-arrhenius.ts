/**
 * Arrhenius glass viscosity (Hetherington 1964) for pure fused silica.
 * Stateless — no DI.
 *
 * References:
 *   Hetherington, G.; Jack, K.H.; Kennedy, J.C. (1964).
 *   "The Viscosity of Vitreous Silica."
 *   Physics and Chemistry of Glasses 5(5):130–136.
 *   ASTM C965-96: Standard Practice for Measuring Viscosity of Glass.
 */

import { HETHERINGTON_1964 } from '../data/viscosity-parameters.data';
import { celsiusToKelvin, kelvinToCelsius } from '../../../common/thermal/utils/temperature';
import {
  GlassViscosityResult,
  ModelInfo,
  ValidationStatus,
  GlassViscosityMetadata,
  ComponentBreakdown,
} from '../types';
import type { ModelSelectionResult } from '../types';
import { ViscosityModel } from '../enums/viscosity-model.enum';
import { ViscosityModelType } from '../enums/viscosity-model-type.enum';
import { VISCOSITY_MODEL_NAMES } from '../constants/viscosity-model-names.constants';
import { calculateFixedPoints } from './calculate-fixed-points.util';

export class GlassViscosityArrhenius {
  /**
   * Calculate log₁₀(η [Pa·s]) for pure fused silica using the
   * Hetherington 1964 Arrhenius model.
   *
   * Formula: log₁₀(η) = A + B / T_K
   *
   * Valid: SiO₂ > 99 wt%, T = 1100–2300°C
   *
   * @param temperature_C  Temperature in °C
   * @returns              log₁₀(η / Pa·s)
   */
  static calcHetheringtonLogEta(temperature_C: number): number {
    const T_K = celsiusToKelvin(temperature_C);
    return HETHERINGTON_1964.A + HETHERINGTON_1964.B / T_K;
  }

  /**
   * Calculate temperature in °C at a target log₁₀(η [Pa·s]) using
   * the Hetherington 1964 Arrhenius model (inverse).
   *
   * T_K = B / (logEta − A)
   *
   * @param logEtaPaS  Target log₁₀(η / Pa·s)
   * @returns          Temperature in °C
   */
  static hetheringtonTemperatureAtLogEta(logEtaPaS: number): number {
    return kelvinToCelsius(HETHERINGTON_1964.B / (logEtaPaS - HETHERINGTON_1964.A));
  }

  /**
   * Build a complete GlassViscosityResult for a pure-silica composition using
   * the Hetherington 1964 Arrhenius model.
   *
   * @param comp                    Normalised wt% composition (should be ~100% SiO₂)
   * @param temperature             Temperature in °C
   * @param selection               Model selection result (carries any warnings)
   * @param version                 Service version string
   * @param buildValidationStatus   Callback: assembles ValidationStatus from model + warnings
   * @param buildComponentBreakdown Callback: categorises composition into network roles
   */
  static buildHetheringtonResult(
    comp: Record<string, number>,
    temperature: number,
    selection: ModelSelectionResult,
    version: string,
    buildValidationStatus: (model: ViscosityModel, warnings: string[]) => ValidationStatus,
    buildComponentBreakdown: (comp: Record<string, number>) => ComponentBreakdown,
  ): GlassViscosityResult {
    const h = HETHERINGTON_1964;
    const logViscosity  = GlassViscosityArrhenius.calcHetheringtonLogEta(temperature);
    const viscosity_Pas = Math.max(1e-3, Math.min(1e15, Math.pow(10, logViscosity)));

    const fp = calculateFixedPoints(GlassViscosityArrhenius.hetheringtonTemperatureAtLogEta);

    const validation = buildValidationStatus(ViscosityModel.HETHERINGTON_1964, selection.warnings);

    const modelInfo: ModelInfo = {
      type: ViscosityModelType.ARRHENIUS,
      systemType: ViscosityModel.HETHERINGTON_1964,
      systemName: VISCOSITY_MODEL_NAMES[ViscosityModel.HETHERINGTON_1964],
      parameters: {
        A: h.A,
        B: h.B,
        temperatureRange: { min_C: h.temperatureRange.min, max_C: h.temperatureRange.max },
      },
    };

    const metadata: GlassViscosityMetadata = {
      calculatedAt: new Date(),
      modelType: ViscosityModelType.ARRHENIUS,
      standard: 'ASTM_C965_96',
      confidence: validation.confidenceLevel,
      reference: h.reference,
      version,
    };

    return {
      viscosity_Pas:  Number(viscosity_Pas.toFixed(4)),
      temperature_C:  temperature,
      logViscosity:   Number(Math.log10(viscosity_Pas).toFixed(3)),
      model:          modelInfo,
      fixedPoints:    fp,
      validation,
      components:     buildComponentBreakdown(comp),
      composition:    comp,
      metadata,
    };
  }
}
