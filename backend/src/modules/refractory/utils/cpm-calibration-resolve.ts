import { BETA0_VALUES } from '../constants/beta0-values.constants';
import { MAX_PHI_VALUES } from '../constants/max-phi-values.constants';
import { PACKING_DEFAULTS } from '../constants/packing-defaults.constants';
import type { CPMCalibration } from '../types/cpm-calibration.type';
import { CompositionAnalyzer } from './composition-analyzer';

/**
 * Resolves CPM β₀ and φ_max from model selection / overrides / auto-detect.
 */
export class CpmCalibrationResolve {
  /** Priority: custom override > model selection > default (ANGULAR). */
  static resolveBeta0(calibration?: CPMCalibration): number {
    if (calibration?.beta0 !== undefined) {
      return calibration.beta0;
    }
    const model = calibration?.beta0Model ?? PACKING_DEFAULTS.DEFAULT_BETA0_MODEL;
    return BETA0_VALUES[model];
  }

  /**
   * Priority: custom override > explicit model > auto-detect / composition default.
   * With no calibration, uses composition-recommended φ_max so micro-filler mixes
   * are not capped at dense-castable 0.76 when the analyzer allows 0.80–0.82.
   */
  static resolveMaxPhi(
    calibration: CPMCalibration | undefined,
    diameters_mm: number[],
    volumeFractions: number[],
  ): number {
    if (calibration?.maxPhi !== undefined) {
      return calibration.maxPhi;
    }
    if (calibration?.maxPhiModel !== undefined && calibration?.autoDetectMaxPhi !== true) {
      return MAX_PHI_VALUES[calibration.maxPhiModel];
    }
    if (calibration?.autoDetectMaxPhi === false) {
      const model = calibration?.maxPhiModel ?? PACKING_DEFAULTS.DEFAULT_MAX_PHI_MODEL;
      return MAX_PHI_VALUES[model];
    }
    const analysis = CompositionAnalyzer.analyzeComposition(diameters_mm, volumeFractions);
    return analysis.recommendedMaxPhi;
  }

  /**
   * Maps compaction pressure to a small index c used in β = β₀ / (1 − K·c).
   * Raw p/(p+pRef) is scaled so typical pressures raise β modestly (not to 1).
   */
  static compactionIndex(pressure_MPa: number): number {
    if (pressure_MPa <= 0) return 0;
    const pRef = PACKING_DEFAULTS.PRESSURE_REF_MPA;
    const raw = pressure_MPa / (pressure_MPa + pRef);
    return Math.min(0.99, raw * PACKING_DEFAULTS.CPM_COMPACTION_SCALE);
  }
}
