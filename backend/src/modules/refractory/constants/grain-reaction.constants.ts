/** Reference conditions of the grain-reaction (penetration depth) model. */
export const GRAIN_REACTION_CONSTANTS = {
  /** Reference reaction penetration depth δ_ref at the reference firing [mm] */
  penetrationDepthRef_mm: 0.1,
  /** Reference firing temperature T_ref [°C] */
  referenceTemperature_C: 1450,
  /** Reference hold time t_ref [h] */
  referenceHoldTime_hours: 2,
} as const;
