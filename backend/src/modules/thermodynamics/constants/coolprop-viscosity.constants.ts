/**
 * Unit conversions for CoolProp viscosity coefficient models
 * (TransportRoutines::viscosity_dilute_collision_integral).
 */
export const COOLPROP_VISCOSITY = {
  /** m → nm for σ in the collision-integral dilute formula */
  M_TO_NM: 1e9,
  /** kg/mol → kg/kmol in the collision-integral dilute formula */
  KG_MOL_TO_KG_KMOL: 1000,
} as const;
