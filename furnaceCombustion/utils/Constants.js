// Shared numeric constants used across the combustion model

const Constants = {
  // Universal constants
  R_UNIVERSAL_J_PER_MOLK: 8.314462618,
  SIGMA_SB_W_PER_M2K4: 5.67e-8,
  P_ATM_PA: 101325,

  // Numerical tolerances
  TOL_GIBBS: 1e-8,
  MAX_ITER_GIBBS: 200,

  // View factors / emissivities (defaults)
  VIEW_FACTOR_FUEL_WALL: 0.5,
  EPS_WALL_INNER_DEFAULT: 0.85,
  EPS_WALL_OUTER_DEFAULT: 0.9,

  // Air properties for natural convection (approximate)
  AIR_NU_M2_PER_S: 1.5e-5,
  AIR_ALPHA_M2_PER_S: 2.2e-5,
  AIR_PR: 0.7,
  AIR_K_W_PER_MK: 0.026,

  // Gravity
  G_M_PER_S2: 9.81,

  // Temperature bounds
  T_MIN_K: 300,
  T_MAX_K: 3000,
  T_MIN_SOLID_BURN_K: 800,

  // Steam injection solver
  STEAM_ENTHALPY_BISECT_MAX_ITER: 40,

  // Water-gas shift equilibrium correlation (coarse)
  WGSHIFT_KEQ_A: -2.0,
  WGSHIFT_KEQ_B_K: 2000.0,
  WGSHIFT_KEQ_C: 0.5,

  // Small positive to avoid divide-by-zero / log(0)
  SMALL_POSITIVE: 1e-20
};

module.exports = Constants;
