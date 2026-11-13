/**
 * Yaws 1999 vapor-pressure correlation (tables 7-1 / 7-2).
 *
 * log₁₀(P/mmHg) = A + B/T + C log₁₀(T) + D T + E T²
 *
 * Dataset stores SI Pa via k = 133.322387415 (mmHg → Pa).
 */
export type YawsVaporPressureEquation = {
  a: number;
  b: number;
  c: number;
  d: number;
  e: number;
};
