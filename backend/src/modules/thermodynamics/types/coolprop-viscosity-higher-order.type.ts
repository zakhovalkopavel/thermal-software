/**
 * CoolProp higher-order (residual) viscosity — modified Batschinski–Hildebrand.
 */
export type CoolpropViscosityHigherOrder = {
  type: 'modified_Batschinski_Hildebrand';
  T_reduce: number;
  rhomolar_reduce: number;
  a: number[];
  d1: number[];
  t1: number[];
  gamma: number[];
  l: number[];
  f: number[];
  d2: number[];
  t2: number[];
  g: number[];
  h: number[];
  p: number[];
  q: number[];
};
