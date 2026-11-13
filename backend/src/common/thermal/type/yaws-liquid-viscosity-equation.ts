/**
 * Yaws 1999 liquid-viscosity correlation (tables 22-1 / 22-2).
 *
 * log₁₀(μ/cP) = A + B/T + C T + D T²
 *
 * Dataset stores SI Pa·s via k = 1e-3 (cP → Pa·s).
 */
export type YawsLiquidViscosityEquation = {
  a: number;
  b: number;
  c: number;
  d: number;
};
