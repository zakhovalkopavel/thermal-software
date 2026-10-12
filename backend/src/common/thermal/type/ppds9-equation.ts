/**
 * VDI PPDS 9 coefficients (liquid viscosity).
 * ref: VDI2010
 *
 * μ = e·exp(a·s^(1/3) + b·s^(4/3)),  s = (c − T)/(T − d)
 *
 * No closed-form antiderivative — numerical integration used.
 */
export type Ppds9Equation = {
  a: number;
  b: number;
  c: number;
  d: number;
  e: number;
};
