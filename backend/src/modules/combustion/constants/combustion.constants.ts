import { STANDARD_CONDITIONS } from '../../../common/thermal/constants';

export const COMBUSTION = {
  FUEL_CAPACITY_J_KGK:    1_500,
  ASH_CAPACITY_J_KGK:     1_000,
  ATMOSPHERIC_PRESSURE_PA: STANDARD_CONDITIONS.PRESSURE_PA,
  FLAME_ROOT_TOL:          1e-6,
  /** Flame temperature search range [K]; the upper end exceeds the cp data range (no dissociation in the model) */
  FLAME_T_MIN_K:           50,
  FLAME_T_MAX_K:           20_000,
  DEFAULT_PO2:             0.21,
  DEFAULT_W_H2OM:          0,
  /** Reference temperature of formation enthalpies [K] */
  T_REF_K:                 STANDARD_CONDITIONS.THERMOCHEMICAL_REFERENCE_TEMPERATURE_K,
  /** Relative tolerance of the water-gas shift extent root */
  WGS_ROOT_REL_TOL:        1e-12,
  /** Relative element-balance residual above which a step result is rejected */
  ELEMENT_BALANCE_TOL:     1e-9,
  /** Allowed deviation of a custom fuel's mass-fraction sum from 1 */
  COMPOSITION_SUM_TOL:     1e-3,
  /** Relative oxygen deficit tolerated when binding sulfur as SO2 (round-off) */
  SULFUR_OXYGEN_REL_TOL:   1e-12,
  /** Lower bound of divisors that may be zero */
  DIVISION_FLOOR:          1e-300,
} as const;
