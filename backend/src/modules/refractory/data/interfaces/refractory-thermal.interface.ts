import { RefractoryThermalMaterial } from '../../enums/refractory-thermal-material.enum';

/**
 * Coefficients for λ(T) = a + b·T_C + c·T_C² + d·T_C³  [W/(m·K)]
 * T_C = T_K − 273  (Celsius)
 */
export interface LambdaCoefficients {
  a: number;
  b: number;
  c?: number;
  d?: number;
}

/** ε(T) = a + 1e-5·b·T_K + 1e-8·c·T_K² + 1e-10·d·T_K³,  T_K clamped to [T_min, T_max] */
export interface PolyEmissivityCoefficients {
  type: 'poly';
  a: number;
  b: number;
  c: number;
  d: number;
  T_min_K: number;
  T_max_K: number;
}

/** ε(T) = a · T_K^b,  T_K clamped to [T_min, T_max] */
export interface ExpEmissivityCoefficients {
  type: 'exp';
  a: number;
  b: number;
  T_min_K: number;
  T_max_K: number;
}

export type EmissivityCoefficients = PolyEmissivityCoefficients | ExpEmissivityCoefficients;

/**
 * Full thermal property record for a refractory material.
 * Sources: Mikheev M.A. — Osnovy teploperedachi, Energiya 1977;
 *          legacy recuperator.js getLambda() ~line 1960, getEmissivity() ~line 1850.
 */
export interface RefractoryThermalEntry {
  materialId: RefractoryThermalMaterial;
  name: string;
  description: string;
  /** λ(T_C) polynomial coefficients */
  lambda: LambdaCoefficients;
  /** ε(T_K) function coefficients */
  emissivity: EmissivityCoefficients;
}
