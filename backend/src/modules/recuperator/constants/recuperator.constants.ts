export const RECUPERATOR = {
  MAX_ITERATIONS:      200,
  CRITERIA_THRESHOLD:  0.01,
  DT_MIN_K:            0.1,
  ENERGY_CRITERIA_ERROR: 1e9,
  T_ROOM_K:            293,
  /** Smoke start = flame / ratio (furnace efficiency ≈ 75 %), legacy recuperator.js */
  FLAME_TO_SMOKE_RATIO: 1.33,
  T_SMOKE_START_MAX_K:  1750,
  /** Species retained for recuperator HTC smoke composition (SO2/Ar dropped) */
  SMOKE_SPECIES: ['N2', 'O2', 'CO2', 'CO', 'H2O', 'H2'] as const,
  /** Ideal-gas specific gas constant used for ρ ≈ p/(R_spec·T) in the optimiser [J/(kg·K)] */
  R_SPECIFIC_DRY_AIR_J_KGK: 287.4,
  /** Sample points for the returned wall λ(T) / ε(T) series when a material is set */
  WALL_PROPERTY_PROFILE_POINTS: 11,
} as const;
