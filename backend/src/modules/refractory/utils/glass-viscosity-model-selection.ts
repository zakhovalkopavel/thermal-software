import { IIDA_MODEL } from '../data/viscosity-parameters.data';
import { ViscosityModel } from '../enums/viscosity-model.enum';
import type { ModelSelectionResult } from '../types';
import { GlassComposition } from './glass-composition';
import { GlassViscosityLakatos } from './glass-viscosity-lakatos';

/**
 * Auto-selects / validates preferred glass & slag viscosity models.
 */
export class GlassViscosityModelSelection {
  /**
   * Resolve model selection, honouring an optional caller preference.
   *
   * Rules (for silicate glass path):
   *   - No preference  → auto-select (Fluegel is default; Lakatos is reserve).
   *   - Preference given, composition in range → use preferred model.
   *   - Preference given, composition OUT of range → fall back to auto-select,
   *     populate preferredModelRejected + preferredModelRejectionReason.
   */
  static resolve(
    comp: Record<string, number>,
    preferredModel?: ViscosityModel,
  ): ModelSelectionResult {
    const auto = GlassViscosityModelSelection.select(comp);

    if (!preferredModel) return auto;

    if (preferredModel === ViscosityModel.HETHERINGTON_1964) {
      const SiO2 = comp['SiO2'] ?? 0;
      if (SiO2 > 99) {
        return { primary: ViscosityModel.HETHERINGTON_1964, reason: 'Preferred by caller', warnings: [] };
      }
      const reason = `HETHERINGTON_1964 requires SiO₂ > 99 wt% (got ${SiO2.toFixed(1)} wt%)`;
      return { ...auto, preferredModelRejected: preferredModel, preferredModelRejectionReason: reason };
    }

    if (preferredModel === ViscosityModel.LAKATOS_1976) {
      const validity = GlassViscosityLakatos.checkLakatosValidity(comp);
      if (validity.valid) {
        return { primary: ViscosityModel.LAKATOS_1976, reason: 'Preferred by caller', warnings: validity.warnings };
      }
      const reason = `LAKATOS_1976 out of range: ${validity.reason}`;
      return { ...auto, preferredModelRejected: preferredModel, preferredModelRejectionReason: reason };
    }

    if (preferredModel === ViscosityModel.FLUEGEL_2007) {
      if (
        auto.primary === ViscosityModel.NOT_SUPPORTED ||
        auto.primary === ViscosityModel.IIDA ||
        auto.primary === ViscosityModel.NAKAMOTO_2007
      ) {
        const reason = `FLUEGEL_2007 not applicable for this composition: ${auto.reason}`;
        return { ...auto, preferredModelRejected: preferredModel, preferredModelRejectionReason: reason };
      }
      return { primary: ViscosityModel.FLUEGEL_2007, reason: 'Preferred by caller', warnings: auto.warnings };
    }

    if (preferredModel === ViscosityModel.IIDA) {
      return { primary: ViscosityModel.IIDA, reason: 'Preferred by caller', warnings: auto.warnings };
    }
    if (preferredModel === ViscosityModel.NAKAMOTO_2007) {
      return { primary: ViscosityModel.NAKAMOTO_2007, reason: 'Preferred by caller', warnings: auto.warnings };
    }

    return auto;
  }

  static select(comp: Record<string, number>): ModelSelectionResult {
    const SiO2  = comp['SiO2']  ?? 0;
    const CaO   = comp['CaO']   ?? 0;
    const FeO   = comp['FeO']   ?? 0;
    const Al2O3 = comp['Al2O3'] ?? 0;
    const CaF2  = comp['CaF2']  ?? 0;

    const totalFluorides =
      CaF2 +
      (comp['NaF']  ?? 0) + (comp['KF']   ?? 0) +
      (comp['MgF2'] ?? 0) + (comp['AlF3'] ?? 0) +
      (comp['LiF']  ?? 0) + (comp['F']    ?? 0);

    if (SiO2 > 99) {
      return {
        primary: ViscosityModel.HETHERINGTON_1964,
        reason: `SiO₂ = ${SiO2.toFixed(1)} wt% — pure fused silica`,
        warnings: [],
      };
    }

    const isSlag = (CaO > 20 && SiO2 < 50) || (FeO > 10) || (CaO + Al2O3 > 60 && SiO2 < 45);

    if (isSlag) {
      const molPct = GlassComposition.wtPctToMolPct(comp);
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

    if (totalFluorides > 20 && SiO2 < 30) {
      return {
        primary: ViscosityModel.NOT_SUPPORTED,
        reason:
          `Total fluoride = ${totalFluorides.toFixed(1)} wt%, SiO₂ = ${SiO2.toFixed(1)} wt% ` +
          `— pure fluoride glass has no reliable published regression.`,
        warnings: [],
      };
    }

    const lakatosResult = GlassViscosityLakatos.checkLakatosValidity(comp);
    return {
      primary: ViscosityModel.FLUEGEL_2007,
      secondary: lakatosResult.valid ? ViscosityModel.LAKATOS_1976 : undefined,
      reason: `Silicate glass — Fluegel 2007 (default). ${lakatosResult.valid ? 'Lakatos 1976 also in range.' : `Lakatos out of range: ${lakatosResult.reason}`}`,
      warnings: lakatosResult.warnings,
    };
  }
}
