/**
 * Yaws 1999 water-solubility correlation (table 17-1).
 *
 * log₁₀(S/ppm wt) = A + B/T + C/T²
 *
 * Dataset stores mass fraction via k = 1e-6 (ppm wt → [-]).
 */
export type YawsWaterSolubilityEquation = {
  a: number;
  b: number;
  c: number;
};
