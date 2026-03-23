/** NASA 7-coefficient polynomial set for one temperature range */
export interface Nasa7CoeffSet {
  a1: number; a2: number; a3: number; a4: number; a5: number;
  /** a6 — integration constant for H/RT */
  a6: number;
  /** a7 — integration constant for S/R */
  a7: number;
}

/**
 * NASA 7-coefficient polynomial data for a species.
 * Low range: 200–Tswitch K, high range: Tswitch–6000 K.
 * Cp/R  = a1 + a2·T + a3·T² + a4·T³ + a5·T⁴
 * H/RT  = a1 + a2·T/2 + a3·T²/3 + a4·T³/4 + a5·T⁴/5 + a6/T
 * S/R   = a1·ln T + a2·T + a3·T²/2 + a4·T³/3 + a5·T⁴/4 + a7
 */
export interface Nasa7Equation {
  /** Coefficients valid below Tswitch */
  low:  [number, number, number, number, number, number, number];
  /** Coefficients valid at or above Tswitch */
  high: [number, number, number, number, number, number, number];
  /** Temperature switching point, default 1000 K */
  Tswitch: number;
}

