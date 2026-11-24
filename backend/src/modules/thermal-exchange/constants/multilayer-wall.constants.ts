export const MULTILAYER_WALL = {
  /** Brent tolerance of the inner surface temperature [K] */
  ROOT_TOL_K:                  1e-6,
  /** Outer surface temperature up to which the empirical α = A + B·(T_outer − T_ambient) is used [K] */
  LOW_TEMP_THRESHOLD_K:        423,
  LOW_TEMP_ALPHA_BASE_W_M2K:   9.8,
  LOW_TEMP_ALPHA_SLOPE_W_M2K2: 0.07,
} as const;
