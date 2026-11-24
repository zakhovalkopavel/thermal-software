/**
 * Yaws 1999 liquid thermal-conductivity correlation (table 24-1).
 *
 * log₁₀(k) = A + B (1 − T/C)^(2/7)   with k in W/(m·K)
 */
export type YawsLiquidConductivityEquation = {
  a: number;
  b: number;
  c: number;
};
