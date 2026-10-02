/** Packed-bed model: particle and solver parameters (reaction data in BED_REACTIONS) */
export const BED_KINETICS = {
  /** Thiele modulus below which the effectiveness factor is 1 */
  PHI_MIN: 1e-2,
  /** Upper bound of the char temperature [K] (legacy T_MAX_K) */
  T_MAX_SOLID_K: 3000,
  /** Lower bound of the char temperature as a fraction of the gas temperature (endothermic layers) */
  T_SOLID_MIN_RATIO: 0.5,
  /** Downward scan step for the ignited root of the char energy balance [K] */
  SOLID_T_SCAN_STEP_K: 25,
  SOLID_T_TOL_K: 1e-3,
  /** brentq tolerance of the layer gas temperature [K]; errors add up over layers */
  GAS_T_ROOT_TOL: 1e-10,
  /** Particle size at the grate as a fraction of the fresh size (particles shrink as the fuel descends) */
  PARTICLE_SIZE_GRATE_RATIO: 0.6,
  /** Oxidation zone: CO mole fraction below and O2 mole fraction above these limits */
  OXIDATION_ZONE_CO_MAX: 0.01,
  OXIDATION_ZONE_O2_MIN: 0.01,
  /** Relative char/gas temperature difference below which the kinetic temperature is the gas temperature */
  KINETIC_T_REL_TOL: 1e-9,
  /** Relative overshoot of species consumption tolerated by the extent limiter (round-off) */
  LIMITER_REL_TOL: 1e-12,
  /** brentq tolerance of the water-gas shift equilibrium extent: absolute + relative to the bracket */
  WGS_EXTENT_ABS_TOL: 1e-15,
  WGS_EXTENT_REL_TOL: 1e-12,
  /** Furnace wall-loss / flame temperature fixed-point iterations */
  FURNACE_ITERATIONS: 50,
  FURNACE_TOL_K: 0.1,
  FURNACE_DAMPING: 0.5,
  /** Layer extents are scaled so no reaction consumes more than this share of an inlet species */
  MAX_CONSUMPTION_FRACTION: 1,
  LIMITER_ITERATIONS: 20,
} as const;
