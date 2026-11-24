/**
 * VDI PPDS 12 coefficients (enthalpy of vaporization).
 * ref: VDI2010
 *
 * ΔHvap = R·Tc·(a·τ^(1/3) + b·τ^(2/3) + c·τ + d·τ² + e·τ⁶),  τ = 1 − T/Tc (0 above Tc)
 */
export type Ppds12Equation = {
  /** Critical temperature [K] */
  Tc: number;
  a: number;
  b: number;
  c: number;
  d: number;
  e: number;
};
