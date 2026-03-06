/**
 * Arrhenius Glass Viscosity Models
 *
 * Pure Arrhenius (log η = A + B/T_K) models for specific glass systems.
 * No NestJS @Injectable — plain functions, usable anywhere.
 *
 * Contents:
 *   calcHetheringtonLogEta          — Hetherington 1964: log η at temperature (pure SiO₂)
 *   hetheringtonTemperatureAtLogEta — inverse: temperature at target log η
 *   buildHetheringtonResult         — Assembles full GlassViscosityResult for pure fused silica
 *
 * References:
 *   Hetherington, G.; Jack, K.H.; Kennedy, J.C. (1964).
 *   "The Viscosity of Vitreous Silica."
 *   Physics and Chemistry of Glasses 5(5):130–136.
 *   ASTM C965-96: Standard Practice for Measuring Viscosity of Glass.
 */

import { HETHERINGTON_1964 } from '../constants/viscosity-parameters';
import {
  GlassViscosityResult,
  ModelInfo,
  FixedPoints,
  ValidationStatus,
  GlassViscosityMetadata,
  ComponentBreakdown,
} from '../interfaces/glass-viscosity.interface';
import { ModelSelectionResult } from '../interfaces/viscosity-parameters.interface';
import {
  ViscosityModel,
  ViscosityModelNames,
  ViscosityModelType,
} from '../enums/viscosity-model.enum';

// ─── Hetherington 1964 ────────────────────────────────────────────────────────

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
export function calcHetheringtonLogEta(temperature_C: number): number {
  const T_K = temperature_C + 273.15;
  return HETHERINGTON_1964.A + HETHERINGTON_1964.B / T_K;
}

/**
 * Calculate temperature in °C at a target log₁₀(η [Pa·s]) using
 * the Hetherington 1964 Arrhenius model (inverse).
 *
 * T_K = B / (logEta − A)  →  T_C = T_K − 273.15
 *
 * @param logEtaPaS  Target log₁₀(η / Pa·s)
 * @returns          Temperature in °C
 */
export function hetheringtonTemperatureAtLogEta(logEtaPaS: number): number {
  return HETHERINGTON_1964.B / (logEtaPaS - HETHERINGTON_1964.A) - 273.15;
}

// ─── Hetherington result builder ─────────────────────────────────────────────

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
export function buildHetheringtonResult(
  comp: Record<string, number>,
  temperature: number,
  selection: ModelSelectionResult,
  version: string,
  buildValidationStatus: (model: ViscosityModel, warnings: string[]) => ValidationStatus,
  buildComponentBreakdown: (comp: Record<string, number>) => ComponentBreakdown,
): GlassViscosityResult {
  const h = HETHERINGTON_1964;
  const logViscosity  = calcHetheringtonLogEta(temperature);
  const viscosity_Pas = Math.max(1e-3, Math.min(1e15, Math.pow(10, logViscosity)));

  const fp: FixedPoints = {
    meltingPoint_C:   hetheringtonTemperatureAtLogEta(1.0),
    workingPoint_C:   hetheringtonTemperatureAtLogEta(3.0),
    flowPoint_C:      hetheringtonTemperatureAtLogEta(4.0),
    softeningPoint_C: hetheringtonTemperatureAtLogEta(6.6),
    annealingPoint_C: hetheringtonTemperatureAtLogEta(12.0),
    strainPoint_C:    hetheringtonTemperatureAtLogEta(13.5),
  };
  fp.spans = {
    meltingToStrain_C:      fp.meltingPoint_C   - fp.strainPoint_C,
    workingToSoftening_C:   fp.workingPoint_C   - fp.softeningPoint_C,
    softeningToAnnealing_C: fp.softeningPoint_C - fp.annealingPoint_C,
    annealingToStrain_C:    fp.annealingPoint_C - fp.strainPoint_C,
  };

  const validation = buildValidationStatus(ViscosityModel.HETHERINGTON_1964, selection.warnings);

  const modelInfo: ModelInfo = {
    type: ViscosityModelType.ARRHENIUS,
    systemType: ViscosityModel.HETHERINGTON_1964,
    systemName: ViscosityModelNames[ViscosityModel.HETHERINGTON_1964],
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
