import { MetalMaterial } from '../../enums/metal-material.enum';

/**
 * λ(T) polynomial coefficients.
 *
 * When `tempUnit` is 'K', T_K is used directly.
 * When `tempUnit` is 'C', T_C = T_K − 273 is used.
 *
 * λ = a + b·T + c·T² + d·T³   [W/(m·K)]
 */
export interface MetalLambdaCoefficients {
  a: number;
  b: number;
  c?: number;
  d?: number;
  /** Temperature unit for the polynomial argument. Default: 'C' */
  tempUnit?: 'K' | 'C';
}

/** ε = a + 1e-5·b·T_K + 1e-8·c·T_K² + 1e-10·d·T_K³,  T_K clamped to [T_min, T_max] */
export interface MetalEmissivityCoefficients {
  a: number;
  b: number;
  c: number;
  d: number;
  T_min_K: number;
  T_max_K: number;
}

/**
 * Full thermal property record for a metal material.
 */
export interface MetalThermalEntry {
  materialId: MetalMaterial;
  name: string;
  description: string;
  lambda: MetalLambdaCoefficients;
  emissivity: MetalEmissivityCoefficients;
}
