/**
 * DIPPR Correlation 106 coefficients (surface tension).
 * Common refs: VDI2010, DIPPR_Doc
 *
 * σ = c1·τ^(c2 + c3·Tr + c4·Tr² + c5·Tr³),  τ = 1 − Tr (0 above Tc),  Tr = T/Tc
 *
 * No closed-form antiderivative — numerical integration used.
 */
export type DipprN106Equation = {
  /** Critical temperature [K] */
  Tc: number;
  c1: number;
  c2: number;
  c3: number;
  c4: number;
  c5: number;
};
