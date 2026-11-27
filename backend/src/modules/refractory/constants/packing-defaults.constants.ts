import { Beta0Model } from '../enums/beta0-model.enum';
import { MaxPhiModel } from '../enums/max-phi-model.enum';

/**
 * Default calibration constants for CPM / Furnas packing.
 */
export const PACKING_DEFAULTS = {
  /** Compaction coefficient K (de Larrard 1999) */
  CPM_K: 9.0,

  /**
   * Scales the 0–1 pressure index before β = β₀ / (1 − K·c).
   * Keeps c ≲ 0.1 so angular β rises gradually instead of jumping to 1.
   */
  CPM_COMPACTION_SCALE: 0.1,

  /** Furnas void filling efficiency */
  FURNAS_EFFICIENCY: 0.75,

  /**
   * Denominator stability floor (allows ~95% of P_crit)
   * Source: Fennis (2011), concrete software practice
   * Research range: 0.01–0.10
   */
  DENOM_FLOOR: 0.05,

  /** Reference pressure for compaction index calculation (MPa) */
  PRESSURE_REF_MPA: 10.0,

  /** Default β₀ model for refractories */
  DEFAULT_BETA0_MODEL: Beta0Model.ANGULAR,

  /** Default φ_max model for refractories */
  DEFAULT_MAX_PHI_MODEL: MaxPhiModel.DENSE_CASTABLE,
} as const;
