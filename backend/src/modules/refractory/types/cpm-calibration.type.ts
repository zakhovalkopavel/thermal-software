import type { Beta0Model } from '../enums/beta0-model.enum';
import type { MaxPhiModel } from '../enums/max-phi-model.enum';

/**
 * CPM calibration parameters with research-backed models.
 * Priority for each resolved value: custom override > auto/model > default.
 */
export type CPMCalibration = {
  /** Particle shape model (determines β₀) - default: ANGULAR (typical refractory) */
  beta0Model?: Beta0Model;
  /** Custom β₀ override (if provided, ignores beta0Model) */
  beta0?: number;
  /** Compaction coefficient K - default: 9.0 (de Larrard 1999) */
  K?: number;
  /** Maximum packing fraction model - default: DENSE_CASTABLE (φ = 0.76) */
  maxPhiModel?: MaxPhiModel;
  /** Custom φ_max override (if provided, ignores maxPhiModel) */
  maxPhi?: number;
  /**
   * Auto-detect φ_max based on composition characteristics.
   * Overrides maxPhiModel if provided, but can be overridden by explicit maxPhi.
   */
  autoDetectMaxPhi?: boolean;
  /**
   * Denominator stability floor - default: 0.05 (allows ~95% of P_crit).
   * Prevents singularity in β₀/(1-K·c_i) when pressure approaches critical value.
   */
  denomFloor?: number;
};
