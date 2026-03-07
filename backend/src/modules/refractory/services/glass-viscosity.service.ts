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
  ModelSelectionResult,
} from '../interfaces/viscosity-parameters.interface';
import {
  ViscosityModel,
  ViscosityModelNames,
  ViscosityModelType,
  ConfidenceLevel,
  ExtrapolationRisk,
} from '../enums/viscosity-model.enum';
import {
  normalizeComposition,
  wtPctToMolPct,
  molPctToWtPct,
} from '../utils/glass-composition.util';
import {
  buildVtf,
  evalVtf,
  temperatureAtLogViscosity,
  calculateFixedPointsFromVtf,
  checkLakatosValidity,
} from '../utils/glass-viscosity-vtf.util';
import {
  buildHetheringtonResult,
  calcHetheringtonLogEta,
  hetheringtonTemperatureAtLogEta,
} from '../utils/glass-viscosity-arrhenius.util';
import { calcIidaViscosity } from '../utils/glass-viscosity-iida.util';
import { calcNakamotoViscosity } from '../utils/glass-viscosity-nakamoto.util';
import { IIDA_MODEL, NAKAMOTO_2007 } from '../constants/viscosity-parameters';
import { brentq } from '../../../common/utils/numeric.util';

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
 * All calculation is delegated to:
 *   utils/glass-composition.util.ts         — normalisation, wt%↔mol%
 *   utils/glass-viscosity-arrhenius.util.ts — Hetherington 1964
 *   utils/glass-viscosity-vtf.util.ts       — Lakatos 1976, Fluegel 2007, VTF
 */
@Injectable()
export class GlassViscosityService {
  private readonly VERSION = '3.1.0';

  // ─── VTF builder (shared by all VTF-based methods) ──────────────────────────

  /**
   * Resolve model selection, honouring an optional caller override.
   *
   * Rules:
   *   - No override  → auto-select (existing logic).
   *   - Override given, composition in range → use requested model.
   *   - Override given, composition OUT of range → fall back to auto-select,
   *     add a warning that the override was not applicable.
   */
  private resolveModel(
    comp: Record<string, number>,
    requestedModel?: ViscosityModel,
  ): ModelSelectionResult {
    const auto = this.selectModel(comp);

    if (!requestedModel) return auto;

    // Validate the requested model against the composition
    if (requestedModel === ViscosityModel.HETHERINGTON_1964) {
      const SiO2 = comp['SiO2'] ?? 0;
      if (SiO2 > 99) return { primary: ViscosityModel.HETHERINGTON_1964, reason: auto.reason, warnings: [] };
      return {
        ...auto,
        warnings: [
          `Requested model HETHERINGTON_1964 requires SiO₂ > 99 wt% (got ${SiO2.toFixed(1)}%). Auto-selected ${ViscosityModelNames[auto.primary]} instead.`,
          ...auto.warnings,
        ],
      };
    }

    if (requestedModel === ViscosityModel.LAKATOS_1976) {
      const validity = checkLakatosValidity(comp);
      if (validity.valid) {
        return { primary: ViscosityModel.LAKATOS_1976, reason: 'Requested by caller', warnings: validity.warnings };
      }
      return {
        ...auto,
        warnings: [
          `Requested model LAKATOS_1976 is out of range: ${validity.reason}. Auto-selected ${ViscosityModelNames[auto.primary]} instead.`,
          ...auto.warnings,
        ],
      };
    }

    if (requestedModel === ViscosityModel.FLUEGEL_2007) {
      if (auto.primary === ViscosityModel.NOT_SUPPORTED ||
          auto.primary === ViscosityModel.IIDA ||
          auto.primary === ViscosityModel.NAKAMOTO_2007) {
        return {
          ...auto,
          warnings: [
            `Requested model FLUEGEL_2007 is not applicable: ${auto.reason}`,
            ...auto.warnings,
          ],
        };
      }
      return { primary: ViscosityModel.FLUEGEL_2007, reason: 'Requested by caller', warnings: auto.warnings };
    }

    if (requestedModel === ViscosityModel.IIDA) {
      return { primary: ViscosityModel.IIDA, reason: 'Requested by caller', warnings: auto.warnings };
    }

    if (requestedModel === ViscosityModel.NAKAMOTO_2007) {
      return { primary: ViscosityModel.NAKAMOTO_2007, reason: 'Requested by caller', warnings: auto.warnings };
    }

    return auto;
  }


  // ─── 1. Single viscosity at a temperature ───────────────────────────────────

  /**
   * Calculate glass viscosity (and full fixed-point curve) at one temperature.
   *
   * @param composition   wt% oxide composition
   * @param temperature   Temperature in °C
   * @param requestedModel  Optional model override (auto-selected if omitted)
   */
  calculateViscosity(
    composition: Record<string, number>,
    temperature: number,
    requestedModel?: ViscosityModel,
  ): GlassViscosityResult {
    const comp      = normalizeComposition(composition);
    const selection = this.resolveModel(comp, requestedModel);
    const modelType = selection.primary;

    if (modelType === ViscosityModel.HETHERINGTON_1964) {
      return buildHetheringtonResult(
        comp, temperature, selection, this.VERSION,
        (m, w) => this.buildValidationStatus(m, w),
        (c)    => this.buildComponentBreakdown(c),
      );
    }
    if (modelType === ViscosityModel.NOT_SUPPORTED) {
      throw new BadRequestException(
        `Composition is outside all supported viscosity models. Reason: ${selection.reason}.`,
      );
    }

    if (modelType === ViscosityModel.IIDA) {
      const result = calcIidaViscosity(comp, temperature);
      return { ...result, composition: comp, secondaryModel: selection.secondary } as any;
    }
    if (modelType === ViscosityModel.NAKAMOTO_2007) {
      const result = calcNakamotoViscosity(comp, temperature);
      return { ...result, composition: comp, secondaryModel: selection.secondary } as any;
    }

    const { vtf, modelRef, isokomWarnings } = buildVtf(comp, selection);
    const logViscosity  = evalVtf(vtf, temperature);
    const viscosity_Pas = Math.max(1e-3, Math.min(1e15, Math.pow(10, logViscosity)));
    const fp            = calculateFixedPointsFromVtf(vtf);
    const allWarnings   = [...selection.warnings, ...isokomWarnings, ...this.validateFixedPointOrdering(fp)];
    const validation    = this.buildValidationStatus(modelType, allWarnings);

    return {
      viscosity_Pas:  Number(viscosity_Pas.toFixed(4)),
      temperature_C:  temperature,
      logViscosity:   Number(Math.log10(viscosity_Pas).toFixed(3)),
      model: {
        type:       ViscosityModelType.VFT,
        systemType: modelType,
        systemName: ViscosityModelNames[modelType],
        parameters: { A: vtf.A, B: vtf.B, T0: vtf.T0, temperatureRange: { min_C: 400, max_C: 1600 } },
      } as ModelInfo,
      fixedPoints: fp,
      validation,
      components:  this.buildComponentBreakdown(comp),
      composition: comp,
      metadata: {
        calculatedAt: new Date(),
        modelType:    ViscosityModelType.VFT,
        standard:     'ASTM_C965_96',
        confidence:   validation.confidenceLevel,
        reference:    modelRef,
        version:      this.VERSION,
      } as GlassViscosityMetadata,
    };
  }

  // ─── 2. Viscosity profile ────────────────────────────────────────────────────

  /**
   * Calculate log₁₀(η) at each temperature in the supplied list.
   *
   * @param composition     wt% oxide composition
   * @param temperatures_C  Array of temperatures in °C
   * @param requestedModel  Optional model override
   * @returns               VTF parameters, fixed points, and per-temperature points
   */
  calculateViscosityProfile(
    composition: Record<string, number>,
    temperatures_C: number[],
    requestedModel?: ViscosityModel,
  ) {
    const comp      = normalizeComposition(composition);
    const selection = this.resolveModel(comp, requestedModel);
    const modelType = selection.primary;

    if (modelType === ViscosityModel.NOT_SUPPORTED) {
      throw new BadRequestException(
        `Composition is outside all supported viscosity models. Reason: ${selection.reason}.`,
      );
    }

    if (modelType === ViscosityModel.IIDA || modelType === ViscosityModel.NAKAMOTO_2007) {
      const calcFn = modelType === ViscosityModel.IIDA ? calcIidaViscosity : calcNakamotoViscosity;
      const firstWarnings = calcFn(comp, temperatures_C[0]).warnings;
      const points = temperatures_C.map(T => {
        const r = calcFn(comp, T);
        return { temperature_C: T, logViscosity: r.logViscosity_Pas, viscosity_Pas: r.viscosity_Pas, thermalState: r.thermalState };
      });
      const allWarnings = [...firstWarnings, ...points.flatMap(() => [] as string[])]
        .filter((w, i, a) => a.indexOf(w) === i);
      return {
        model: ViscosityModelNames[modelType],
        points,
        fixedPoints: null,
        secondaryModel: selection.secondary ? ViscosityModelNames[selection.secondary] : undefined,
        validation: this.buildValidationStatus(modelType, allWarnings),
      };
    }

    // Hetherington: evaluate each temperature directly (no VTF)
    if (modelType === ViscosityModel.HETHERINGTON_1964) {
      const points = temperatures_C.map(T => {
        const logEta = calcHetheringtonLogEta(T);
        return { temperature_C: T, logViscosity: Number(logEta.toFixed(3)), viscosity_Pas: Number(Math.pow(10, logEta).toFixed(4)) };
      });
      const validation = this.buildValidationStatus(modelType, selection.warnings);
      return { model: ViscosityModelNames[modelType], points, fixedPoints: null, validation };
    }

    const { vtf, modelRef, isokomWarnings } = buildVtf(comp, selection);
    const fp         = calculateFixedPointsFromVtf(vtf);
    const allWarnings = [...selection.warnings, ...isokomWarnings, ...this.validateFixedPointOrdering(fp)];
    const validation  = this.buildValidationStatus(modelType, allWarnings);

    const points = temperatures_C.map(T => {
      const logEta = evalVtf(vtf, T);
      return {
        temperature_C: T,
        logViscosity:  Number(logEta.toFixed(3)),
        viscosity_Pas: Number(Math.max(1e-3, Math.min(1e15, Math.pow(10, logEta))).toFixed(4)),
      };
    });

    return {
      model:       ViscosityModelNames[modelType],
      modelRef,
      vtfParameters: { A: vtf.A, B: vtf.B, T0: vtf.T0 },
      points,
      fixedPoints: fp,
      validation,
    };
  }

  // ─── 3. Temperature at a target viscosity ────────────────────────────────────

  /**
   * Return the temperature (°C) at which the glass reaches a target log₁₀(η).
   *
   * @param composition   wt% oxide composition
   * @param targetLogEta  Target log₁₀(η / Pa·s)
   * @param requestedModel Optional model override
   */
  getTemperatureAtViscosity(
    composition: Record<string, number>,
    targetLogEta: number,
    requestedModel?: ViscosityModel,
  ) {
    const comp      = normalizeComposition(composition);
    const selection = this.resolveModel(comp, requestedModel);
    const modelType = selection.primary;

    if (modelType === ViscosityModel.NOT_SUPPORTED) {
      throw new BadRequestException(
        `Composition is outside all supported viscosity models. Reason: ${selection.reason}.`,
      );
    }

    if (modelType === ViscosityModel.IIDA || modelType === ViscosityModel.NAKAMOTO_2007) {
      const calcFn = modelType === ViscosityModel.IIDA ? calcIidaViscosity : calcNakamotoViscosity;
      const range  = modelType === ViscosityModel.IIDA
        ? { min: IIDA_MODEL.temperatureRange.min_C, max: IIDA_MODEL.temperatureRange.max_C }
        : { min: NAKAMOTO_2007.temperatureRange.min_C, max: NAKAMOTO_2007.temperatureRange.max_C };
      const f = (T: number) => calcFn(comp, T).logViscosity_Pas - targetLogEta;
      const { root: T_C } = brentq(f, range.min, range.max, 1e-4);
      const validation = this.buildValidationStatus(modelType, selection.warnings);
      return {
        model:         ViscosityModelNames[modelType],
        targetLogEta,
        temperature_C: Number(T_C.toFixed(1)),
        validation,
        secondaryModel: selection.secondary ? ViscosityModelNames[selection.secondary] : undefined,
      };
    }

    if (modelType === ViscosityModel.HETHERINGTON_1964) {
      const temperature_C = hetheringtonTemperatureAtLogEta(targetLogEta);
      const validation    = this.buildValidationStatus(modelType, selection.warnings);
      return {
        model:         ViscosityModelNames[modelType],
        targetLogEta,
        temperature_C: Number(temperature_C.toFixed(1)),
        validation,
      };
    }

    const { vtf, modelRef, isokomWarnings } = buildVtf(comp, selection);
    const temperature_C = temperatureAtLogViscosity(vtf, targetLogEta);
    const allWarnings   = [...selection.warnings, ...isokomWarnings];
    const validation    = this.buildValidationStatus(modelType, allWarnings);

    return {
      model:         ViscosityModelNames[modelType],
      modelRef,
      targetLogEta,
      temperature_C: Number(temperature_C.toFixed(1)),
      vtfParameters: { A: vtf.A, B: vtf.B, T0: vtf.T0 },
      validation,
    };
  }

  // ─── 4. Composition conversion ───────────────────────────────────────────────

  /**
   * Convert a glass composition between wt% and mol%.
   *
   * @param composition  Input composition
   * @param direction    'wt_to_mol' | 'mol_to_wt'
   */
  convertComposition(
    composition: Record<string, number>,
    direction: 'wt_to_mol' | 'mol_to_wt',
  ): { input: Record<string, number>; output: Record<string, number>; direction: string } {
    const input  = normalizeComposition(composition);
    const output = direction === 'wt_to_mol' ? wtPctToMolPct(input) : molPctToWtPct(input);
    return { input, output, direction };
  }

  // ─── Model selection ─────────────────────────────────────────────────────────

  selectModel(comp: Record<string, number>): ModelSelectionResult {
    const SiO2  = comp['SiO2']  ?? 0;
    const CaO   = comp['CaO']   ?? 0;
    const FeO   = comp['FeO']   ?? 0;
    const Al2O3 = comp['Al2O3'] ?? 0;
    const Na2O  = comp['Na2O']  ?? 0;
    const CaF2  = comp['CaF2']  ?? 0;

    const totalFluorides =
      CaF2 +
      (comp['NaF']  ?? 0) + (comp['KF']   ?? 0) +
      (comp['MgF2'] ?? 0) + (comp['AlF3'] ?? 0) +
      (comp['LiF']  ?? 0) + (comp['F']    ?? 0);

    // ── Pure fused silica ───────────────────────────────────────────────────
    if (SiO2 > 99) {
      return {
        primary: ViscosityModel.HETHERINGTON_1964,
        reason: `SiO₂ = ${SiO2.toFixed(1)} wt% — pure fused silica`,
        warnings: [],
      };
    }

    // ── Slag detection ──────────────────────────────────────────────────────
    const isSlag = (CaO > 20 && SiO2 < 50) || (FeO > 10) || (CaO + Al2O3 > 60 && SiO2 < 45);

    if (isSlag) {
      // CaF₂ > 8 mol% (rough wt% proxy ~10%) → Nakamoto is preferred
      // Otherwise Iida handles all industrial slags incl. CaF₂ ≤ 8 mol%
      const molPct = wtPctToMolPct(comp);
      const CaF2_mol = (molPct['CaF2'] ?? 0) / 100;
      if (CaF2_mol > IIDA_MODEL.CaF2_max_mol) {
        return {
          primary:   ViscosityModel.NAKAMOTO_2007,
          secondary: ViscosityModel.IIDA,
          reason:
            `Slag detected with CaF₂ = ${(CaF2_mol * 100).toFixed(1)} mol% ` +
            `> ${IIDA_MODEL.CaF2_max_mol * 100}% — Nakamoto 2007 preferred for high-fluoride slags.`,
          warnings: [],
        };
      }
      return {
        primary:   ViscosityModel.IIDA,
        secondary: ViscosityModel.NAKAMOTO_2007,
        reason:
          `Slag detected (CaO=${CaO.toFixed(1)}, SiO₂=${SiO2.toFixed(1)} wt%). ` +
          `Iida model applied; Nakamoto 2007 also available.`,
        warnings: [],
      };
    }

    // ── Pure fluoride glass (no SiO₂ backbone) — not supported ─────────────
    if (totalFluorides > 20 && SiO2 < 30) {
      return {
        primary: ViscosityModel.NOT_SUPPORTED,
        reason:
          `Total fluoride = ${totalFluorides.toFixed(1)} wt%, SiO₂ = ${SiO2.toFixed(1)} wt% ` +
          `— pure fluoride glass has no reliable published regression.`,
        warnings: [],
      };
    }

    // ── Silicate glass path (Lakatos → Fluegel) ─────────────────────────────
    const lakatosResult = checkLakatosValidity(comp);
    if (lakatosResult.valid) {
      return {
        primary: ViscosityModel.LAKATOS_1976,
        reason: `Within Lakatos 1976 range (SiO₂ ${SiO2.toFixed(1)} wt%, Na₂O ${Na2O.toFixed(1)} wt%)`,
        warnings: lakatosResult.warnings,
      };
    }
    return {
      primary: ViscosityModel.FLUEGEL_2007,
      reason: lakatosResult.reason ?? 'Outside Lakatos range — using Fluegel 2007',
      warnings: lakatosResult.warnings,
    };
  }


  // ─── Private helpers ─────────────────────────────────────────────────────────

  private validateFixedPointOrdering(fp: FixedPoints): string[] {
    const w: string[] = [];
    if (fp.strainPoint_C    >= fp.annealingPoint_C)  w.push(`ORDERING_VIOLATION: strain ≥ annealing`);
    if (fp.annealingPoint_C >= fp.softeningPoint_C)  w.push(`ORDERING_VIOLATION: annealing ≥ softening`);
    if (fp.softeningPoint_C >= fp.workingPoint_C)    w.push(`ORDERING_VIOLATION: softening ≥ working`);
    if (fp.workingPoint_C   >= fp.meltingPoint_C)    w.push(`ORDERING_VIOLATION: working ≥ melting`);
    return w;
  }

  private buildValidationStatus(modelType: ViscosityModel, warnings: string[]): ValidationStatus {
    let confidenceLevel   = ConfidenceLevel.HIGH;
    let extrapolationRisk = ExtrapolationRisk.NONE;
    const compositionIssues: CompositionIssue[] = [];
    const hasOrdering = warnings.some(w => w.startsWith('ORDERING_VIOLATION'));
    const outOfRange  = warnings.filter(w =>
      w.includes('outside') || w.includes('exceeds') || w.includes('above') ||
      w.includes('below')   || w.includes('not modelled'),
    ).length;
    if      (hasOrdering)     { confidenceLevel = ConfidenceLevel.LOW;    extrapolationRisk = ExtrapolationRisk.SEVERE; }
    else if (outOfRange >= 3) { confidenceLevel = ConfidenceLevel.LOW;    extrapolationRisk = ExtrapolationRisk.MODERATE; }
    else if (outOfRange >= 1) { confidenceLevel = ConfidenceLevel.MEDIUM; extrapolationRisk = ExtrapolationRisk.MINOR; }
    const systemName = ViscosityModelNames[modelType] ?? modelType;
    return { systemDetected: systemName, confidenceLevel, warnings, componentsInRange: 0, componentsOutOfRange: outOfRange, extrapolationRisk, compositionIssues };
  }

  private buildComponentBreakdown(comp: Record<string, number>): ComponentBreakdown {
    const formers    = new Set(['SiO2','Al2O3','Cr2O3','ZrO2','TiO2','B2O3','GeO2','P2O5']);
    const modifiers  = new Set(['Na2O','K2O','Li2O','PbO','CaO','BaO','SrO','MnO','FeO','Fe2O3','CoO','NiO','CuO','MgO','ZnO','MnO2']);
    const fluorides_ = new Set(['NaF','KF','LiF','CaF2','MgF2','AlF3','F']);
    const chlorides_ = new Set(['NaCl','KCl','CaCl2','MgCl2','FeCl2','FeCl3']);
    const networkFormers: ComponentEffect[] = [], networkModifiers: ComponentEffect[] = [],
          fluorides: ComponentEffect[] = [], chlorides: ComponentEffect[] = [];
    for (const [component, percentage] of Object.entries(comp)) {
      if (percentage <= 0) continue;
      const effect = getComponentEffect(component)?.viscosityEffect ?? 0;
      const entry: ComponentEffect = { component, percentage, effect };

      if      (formers.has(component))    networkFormers.push(entry);
      else if (modifiers.has(component))  networkModifiers.push(entry);
      else if (fluorides_.has(component)) fluorides.push(entry);
      else if (chlorides_.has(component)) chlorides.push(entry);
    }

    return { networkFormers, networkModifiers, fluorides, chlorides };
  }
}

