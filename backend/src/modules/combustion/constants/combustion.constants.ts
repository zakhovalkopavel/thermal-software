export const COMBUSTION = {
  Q_CARBON_J_KG:         32_900_000,
  Q_CO_J_KG:              9_208_333,
  Q_H2_J_KG:             21_000_000,
  FUEL_CAPACITY_J_KGK:    1_500,
  ASH_CAPACITY_J_KGK:     1_000,
  ATMOSPHERIC_PRESSURE_PA: 101_325,
  FLAME_TO_SMOKE_RATIO:    1.33,
  T_SMOKE_START_MAX_K:     1750,
  MAX_FLAME_ITERATIONS:    100,
  FLAME_CONVERGENCE_K:     1,
  DEFAULT_PO2:             0.21,
  DEFAULT_W_H2OM:          0,
} as const;

/** Molar masses [kg/mol] */
export const MOLAR_MASS = {
  N2:  0.028,
  O2:  0.032,
  CO2: 0.044,
  CO:  0.028,
  H2O: 0.018,
  H2:  0.002,
} as const;
