/**
 * VDI PPDS 10 coefficients (saturated liquid density).
 * ref: VDI2010
 *
 * ρ = ρc + a·τ^0.35 + b·τ^(2/3) + c·τ + d·τ^(4/3),  τ = 1 − T/Tc (0 above Tc)
 */
export type Ppds10Equation = {
  /** Critical temperature [K] */
  Tc: number;
  /** Critical density [kg/m3] */
  rhoc: number;
  a: number;
  b: number;
  c: number;
  d: number;
};
