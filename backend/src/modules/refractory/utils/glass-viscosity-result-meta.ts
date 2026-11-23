import { ComponentProperties } from './component-properties';
import { ConfidenceLevel } from '../enums/confidence-level.enum';
import { ExtrapolationRisk } from '../enums/extrapolation-risk.enum';
import { ViscosityModel } from '../enums/viscosity-model.enum';
import { VISCOSITY_MODEL_NAMES } from '../constants/viscosity-model-names.constants';
import type {
  ComponentBreakdown,
  ComponentEffect,
  CompositionIssue,
  FixedPoints,
  ValidationStatus,
} from '../types';

/**
 * Validation status, fixed-point ordering checks, and component breakdown for glass viscosity.
 */
export class GlassViscosityResultMeta {
  static validateFixedPointOrdering(fp: FixedPoints): string[] {
    const w: string[] = [];
    if (fp.strainPoint_C    >= fp.annealingPoint_C)  w.push(`ORDERING_VIOLATION: strain ≥ annealing`);
    if (fp.annealingPoint_C >= fp.softeningPoint_C)  w.push(`ORDERING_VIOLATION: annealing ≥ softening`);
    if (fp.softeningPoint_C >= fp.workingPoint_C)    w.push(`ORDERING_VIOLATION: softening ≥ working`);
    if (fp.workingPoint_C   >= fp.meltingPoint_C)    w.push(`ORDERING_VIOLATION: working ≥ melting`);
    return w;
  }

  static buildValidationStatus(modelType: ViscosityModel, warnings: string[]): ValidationStatus {
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
    const systemName = VISCOSITY_MODEL_NAMES[modelType] ?? modelType;
    return {
      systemDetected: systemName,
      confidenceLevel,
      warnings,
      componentsInRange: 0,
      componentsOutOfRange: outOfRange,
      extrapolationRisk,
      compositionIssues,
    };
  }

  static buildComponentBreakdown(comp: Record<string, number>): ComponentBreakdown {
    const formers    = new Set(['SiO2','Al2O3','Cr2O3','ZrO2','TiO2','B2O3','GeO2','P2O5']);
    const modifiers  = new Set(['Na2O','K2O','Li2O','PbO','CaO','BaO','SrO','MnO','FeO','Fe2O3','CoO','NiO','CuO','MgO','ZnO','MnO2']);
    const fluorides_ = new Set(['NaF','KF','LiF','CaF2','MgF2','AlF3','F']);
    const chlorides_ = new Set(['NaCl','KCl','CaCl2','MgCl2','FeCl2','FeCl3']);
    const networkFormers: ComponentEffect[] = [];
    const networkModifiers: ComponentEffect[] = [];
    const fluorides: ComponentEffect[] = [];
    const chlorides: ComponentEffect[] = [];
    for (const [component, percentage] of Object.entries(comp)) {
      if (percentage <= 0) continue;
      const effect = ComponentProperties.get(component)?.viscosityEffect ?? 0;
      const entry: ComponentEffect = { component, percentage, effect };

      if      (formers.has(component))    networkFormers.push(entry);
      else if (modifiers.has(component))  networkModifiers.push(entry);
      else if (fluorides_.has(component)) fluorides.push(entry);
      else if (chlorides_.has(component)) chlorides.push(entry);
    }

    return { networkFormers, networkModifiers, fluorides, chlorides };
  }
}
