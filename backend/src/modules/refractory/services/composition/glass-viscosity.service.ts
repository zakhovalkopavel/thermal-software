import { Injectable, BadRequestException } from '@nestjs/common';
import {
  GlassViscosityResult,
  ModelInfo,
  GlassViscosityMetadata,
  ModelSelectionResult,
} from '../../types';
import { ViscosityModel } from '../../enums/viscosity-model.enum';
import { ViscosityModelType } from '../../enums/viscosity-model-type.enum';
import { VISCOSITY_MODEL_NAMES } from '../../constants/viscosity-model-names.constants';
import { GLASS_VISCOSITY_VERSION } from '../../constants/glass-viscosity-version.constants';
import { GlassComposition } from '../../utils/glass-composition';
import { InvalidCompositionError } from '../../utils/invalid-composition-error';
import { GlassViscosityArrhenius } from '../../utils/glass-viscosity-arrhenius';
import { GlassViscosityIida } from '../../utils/glass-viscosity-iida';
import { GlassViscosityModelSelection } from '../../utils/glass-viscosity-model-selection';
import { GlassViscosityResultMeta } from '../../utils/glass-viscosity-result-meta';
import { GlassViscosityVtf } from '../../utils/glass-viscosity-vtf';
import { calcNakamotoViscosity } from '../../utils/glass-viscosity-nakamoto.util';
import { IIDA_MODEL, NAKAMOTO_2007 } from '../../data/viscosity-parameters.data';
import { brentq } from '../../../../common/utils/root-finding';

/**
 * Glass Viscosity Calculator Service — v3
 *
 * Public methods:
 *   calculateViscosity        — log η + η at one temperature
 *   calculateViscosityProfile — log η at many temperatures
 *   getTemperatureAtViscosity — inverse: temperature for a target log η
 *   convertComposition        — wt% ↔ mol% conversion
 *   selectModel               — auto-selects or validates a requested model
 *
 * Model selection / validation meta live in static utils; equation work is delegated
 * to glass-viscosity-{arrhenius,vtf,iida,lakatos} and nakamoto.
 */
@Injectable()
export class GlassViscosityService {

  /**
   * Calculate glass viscosity (and full fixed-point curve) at one temperature.
   */
  calculateViscosity(
    composition: Record<string, number>,
    temperature: number,
    requestedModel?: ViscosityModel,
  ): GlassViscosityResult {
    const comp      = this.normalize(composition);
    const selection = GlassViscosityModelSelection.resolve(comp, requestedModel);
    const modelType = selection.primary;

    if (modelType === ViscosityModel.HETHERINGTON_1964) {
      return GlassViscosityArrhenius.buildHetheringtonResult(
        comp, temperature, selection, GLASS_VISCOSITY_VERSION,
        (m, w) => GlassViscosityResultMeta.buildValidationStatus(m, w),
        (c)    => GlassViscosityResultMeta.buildComponentBreakdown(c),
      );
    }
    if (modelType === ViscosityModel.NOT_SUPPORTED) {
      throw new BadRequestException(
        `Composition is outside all supported viscosity models. Reason: ${selection.reason}.`,
      );
    }

    if (modelType === ViscosityModel.IIDA) {
      const result = GlassViscosityIida.calcIidaViscosity(comp, temperature);
      return { ...result, composition: comp, secondaryModel: selection.secondary } as any;
    }
    if (modelType === ViscosityModel.NAKAMOTO_2007) {
      const result = calcNakamotoViscosity(comp, temperature);
      return { ...result, composition: comp, secondaryModel: selection.secondary } as any;
    }

    const { vtf, modelRef, isokomWarnings } = GlassViscosityVtf.buildVtf(comp, selection);
    const logViscosity  = GlassViscosityVtf.evalVtf(vtf, temperature);
    const viscosity_Pas = Math.max(1e-3, Math.min(1e15, Math.pow(10, logViscosity)));
    const fp            = GlassViscosityVtf.calculateFixedPointsFromVtf(vtf);
    const allWarnings   = [
      ...selection.warnings,
      ...isokomWarnings,
      ...GlassViscosityResultMeta.validateFixedPointOrdering(fp),
    ];
    const validation    = GlassViscosityResultMeta.buildValidationStatus(modelType, allWarnings);

    return {
      viscosity_Pas:  Number(viscosity_Pas.toFixed(4)),
      temperature_C:  temperature,
      logViscosity:   Number(Math.log10(viscosity_Pas).toFixed(3)),
      model: {
        type:       ViscosityModelType.VFT,
        systemType: modelType,
        systemName: VISCOSITY_MODEL_NAMES[modelType],
        parameters: { A: vtf.A, B: vtf.B, T0: vtf.T0, temperatureRange: { min_C: 400, max_C: 1600 } },
      } as ModelInfo,
      fixedPoints: fp,
      validation,
      components:  GlassViscosityResultMeta.buildComponentBreakdown(comp),
      composition: comp,
      metadata: {
        calculatedAt: new Date(),
        modelType:    ViscosityModelType.VFT,
        standard:     'ASTM_C965_96',
        confidence:   validation.confidenceLevel,
        reference:    modelRef,
        version:      GLASS_VISCOSITY_VERSION,
      } as GlassViscosityMetadata,
    };
  }

  /**
   * Calculate log₁₀(η) at each temperature in the supplied list.
   */
  calculateViscosityProfile(
    composition: Record<string, number>,
    temperatures_C: number[],
    requestedModel?: ViscosityModel,
  ) {
    const comp      = this.normalize(composition);
    const selection = GlassViscosityModelSelection.resolve(comp, requestedModel);
    const modelType = selection.primary;

    if (modelType === ViscosityModel.NOT_SUPPORTED) {
      throw new BadRequestException(
        `Composition is outside all supported viscosity models. Reason: ${selection.reason}.`,
      );
    }

    if (modelType === ViscosityModel.IIDA || modelType === ViscosityModel.NAKAMOTO_2007) {
      const calcFn = modelType === ViscosityModel.IIDA
        ? GlassViscosityIida.calcIidaViscosity
        : calcNakamotoViscosity;
      const firstWarnings = calcFn(comp, temperatures_C[0]).warnings;
      const points = temperatures_C.map(T => {
        const r = calcFn(comp, T);
        return {
          temperature_C: T,
          logViscosity: r.logViscosity_Pas,
          viscosity_Pas: r.viscosity_Pas,
          thermalState: r.thermalState,
        };
      });
      const allWarnings = [...firstWarnings, ...points.flatMap(() => [] as string[])]
        .filter((w, i, a) => a.indexOf(w) === i);
      return {
        model: VISCOSITY_MODEL_NAMES[modelType],
        points,
        fixedPoints: null,
        secondaryModel: selection.secondary ? VISCOSITY_MODEL_NAMES[selection.secondary] : undefined,
        validation: GlassViscosityResultMeta.buildValidationStatus(modelType, allWarnings),
      };
    }

    if (modelType === ViscosityModel.HETHERINGTON_1964) {
      const points = temperatures_C.map(T => {
        const logEta = GlassViscosityArrhenius.calcHetheringtonLogEta(T);
        return {
          temperature_C: T,
          logViscosity: Number(logEta.toFixed(3)),
          viscosity_Pas: Number(Math.pow(10, logEta).toFixed(4)),
        };
      });
      const validation = GlassViscosityResultMeta.buildValidationStatus(modelType, selection.warnings);
      return { model: VISCOSITY_MODEL_NAMES[modelType], points, fixedPoints: null, validation };
    }

    const { vtf, modelRef, isokomWarnings } = GlassViscosityVtf.buildVtf(comp, selection);
    const fp         = GlassViscosityVtf.calculateFixedPointsFromVtf(vtf);
    const allWarnings = [
      ...selection.warnings,
      ...isokomWarnings,
      ...GlassViscosityResultMeta.validateFixedPointOrdering(fp),
    ];
    const validation  = GlassViscosityResultMeta.buildValidationStatus(modelType, allWarnings);

    const points = temperatures_C.map(T => {
      const logEta = GlassViscosityVtf.evalVtf(vtf, T);
      return {
        temperature_C: T,
        logViscosity:  Number(logEta.toFixed(3)),
        viscosity_Pas: Number(Math.max(1e-3, Math.min(1e15, Math.pow(10, logEta))).toFixed(4)),
      };
    });

    return {
      model:       VISCOSITY_MODEL_NAMES[modelType],
      modelRef,
      vtfParameters: { A: vtf.A, B: vtf.B, T0: vtf.T0 },
      points,
      fixedPoints: fp,
      validation,
    };
  }

  /**
   * Return the temperature (°C) at which the glass reaches a target log₁₀(η).
   */
  getTemperatureAtViscosity(
    composition: Record<string, number>,
    targetLogEta: number,
    requestedModel?: ViscosityModel,
  ) {
    const comp      = this.normalize(composition);
    const selection = GlassViscosityModelSelection.resolve(comp, requestedModel);
    const modelType = selection.primary;

    if (modelType === ViscosityModel.NOT_SUPPORTED) {
      throw new BadRequestException(
        `Composition is outside all supported viscosity models. Reason: ${selection.reason}.`,
      );
    }

    if (modelType === ViscosityModel.IIDA || modelType === ViscosityModel.NAKAMOTO_2007) {
      const calcFn = modelType === ViscosityModel.IIDA
        ? GlassViscosityIida.calcIidaViscosity
        : calcNakamotoViscosity;
      const range  = modelType === ViscosityModel.IIDA
        ? { min: IIDA_MODEL.temperatureRange.min_C, max: IIDA_MODEL.temperatureRange.max_C }
        : { min: NAKAMOTO_2007.temperatureRange.min_C, max: NAKAMOTO_2007.temperatureRange.max_C };
      const f = (T: number) => calcFn(comp, T).logViscosity_Pas - targetLogEta;
      const { root: T_C } = brentq(f, range.min, range.max, 1e-4);
      const validation = GlassViscosityResultMeta.buildValidationStatus(modelType, selection.warnings);
      return {
        model:         VISCOSITY_MODEL_NAMES[modelType],
        targetLogEta,
        temperature_C: Number(T_C.toFixed(1)),
        validation,
        secondaryModel: selection.secondary ? VISCOSITY_MODEL_NAMES[selection.secondary] : undefined,
      };
    }

    if (modelType === ViscosityModel.HETHERINGTON_1964) {
      const temperature_C = GlassViscosityArrhenius.hetheringtonTemperatureAtLogEta(targetLogEta);
      const validation    = GlassViscosityResultMeta.buildValidationStatus(modelType, selection.warnings);
      return {
        model:         VISCOSITY_MODEL_NAMES[modelType],
        targetLogEta,
        temperature_C: Number(temperature_C.toFixed(1)),
        validation,
      };
    }

    const { vtf, modelRef, isokomWarnings } = GlassViscosityVtf.buildVtf(comp, selection);
    const temperature_C = GlassViscosityVtf.temperatureAtLogViscosity(vtf, targetLogEta);
    const allWarnings   = [...selection.warnings, ...isokomWarnings];
    const validation    = GlassViscosityResultMeta.buildValidationStatus(modelType, allWarnings);

    return {
      model:         VISCOSITY_MODEL_NAMES[modelType],
      modelRef,
      targetLogEta,
      temperature_C: Number(temperature_C.toFixed(1)),
      vtfParameters: { A: vtf.A, B: vtf.B, T0: vtf.T0 },
      validation,
    };
  }

  /**
   * Convert a glass composition between wt% and mol%.
   */
  convertComposition(
    composition: Record<string, number>,
    direction: 'wt_to_mol' | 'mol_to_wt',
  ): { input: Record<string, number>; output: Record<string, number>; direction: string } {
    const input  = this.normalize(composition);
    const output = direction === 'wt_to_mol'
      ? GlassComposition.wtPctToMolPct(input)
      : GlassComposition.molPctToWtPct(input);
    return { input, output, direction };
  }

  selectModel(comp: Record<string, number>): ModelSelectionResult {
    return GlassViscosityModelSelection.select(comp);
  }

  /** Normalise to 100 % before any model selection or calculation. */
  private normalize(composition: Record<string, number>): Record<string, number> {
    try {
      return GlassComposition.normalizeComposition(composition);
    } catch (error) {
      if (error instanceof InvalidCompositionError) throw new BadRequestException(error.message);
      throw error;
    }
  }
}
