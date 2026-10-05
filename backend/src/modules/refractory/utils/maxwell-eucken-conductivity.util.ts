/**
 * Effective conductivity of a porous solid, Maxwell–Eucken with the solid as the
 * continuous phase and isolated pores [W/(m·K)]:
 *
 * λ_eff = λ_s · (2λ_s + λ_g − 2P(λ_s − λ_g)) / (2λ_s + λ_g + P(λ_s − λ_g))
 *
 * @param lambdaSolid_WmK  dense solid conductivity
 * @param lambdaGas_WmK    pore gas conductivity
 * @param porosity         pore volume fraction P (0–1)
 */
export function maxwellEuckenConductivity(lambdaSolid_WmK: number, lambdaGas_WmK: number, porosity: number): number {
  const s = lambdaSolid_WmK;
  const g = lambdaGas_WmK;
  return (s * (2 * s + g - 2 * porosity * (s - g))) / (2 * s + g + porosity * (s - g));
}
