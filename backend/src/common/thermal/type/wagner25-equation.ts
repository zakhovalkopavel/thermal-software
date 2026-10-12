/**
 * Wagner 2.5/5 vapour pressure coefficients (VDI PPDS 16).
 * ref: VDI2010
 *
 * ln(P) = ln(Pc) + (a·τ + b·τ^1.5 + c·τ^2.5 + d·τ⁵)/Tr,  Tr = min(T/Tc, 1),  τ = 1 − Tr
 *
 * No closed-form antiderivative — numerical integration used.
 */
export type Wagner25Equation = {
  /** Critical temperature [K] */
  Tc: number;
  /** Critical pressure [Pa] */
  Pc: number;
  a: number;
  b: number;
  c: number;
  d: number;
};
