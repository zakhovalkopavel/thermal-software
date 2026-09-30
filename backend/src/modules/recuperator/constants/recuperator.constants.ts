export const RECUPERATOR = {
  MAX_ITERATIONS:      200,
  CRITERIA_THRESHOLD:  0.01,
  DT_MIN_K:            0.1,
  ENERGY_CRITERIA_ERROR: 1e9,
  T_ROOM_K:            293,
  /** Smoke start = flame / ratio (furnace efficiency ≈ 75 %), legacy recuperator.js */
  FLAME_TO_SMOKE_RATIO: 1.33,
  T_SMOKE_START_MAX_K:  1750,
} as const;
