/** ε = a + 1e-5·b·T_K + 1e-8·c·T_K² + 1e-10·d·T_K³,  T_K clamped to [T_min, T_max] */
export type MetalEmissivityCoefficients = {
  a: number;
  b: number;
  c: number;
  d: number;
  T_min_K: number;
  T_max_K: number;
};
