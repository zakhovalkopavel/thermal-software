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

  /** Priority: custom override > auto-detection > model selection > default. */
  static resolveMaxPhi(
    calibration: CPMCalibration | undefined,
    diameters_mm: number[],
    volumeFractions: number[],
  ): number {
    if (calibration?.maxPhi !== undefined) {
      return calibration.maxPhi;
    }
    if (calibration?.autoDetectMaxPhi === true) {
      const analysis = CompositionAnalyzer.analyzeComposition(diameters_mm, volumeFractions);
      return analysis.recommendedMaxPhi;
    }
    const model = calibration?.maxPhiModel ?? PACKING_DEFAULTS.DEFAULT_MAX_PHI_MODEL;
    return MAX_PHI_VALUES[model];
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
