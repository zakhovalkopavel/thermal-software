import { GAS_REGISTRY } from '../../../../common/thermal/compound/gas/registry';
import { Species } from '../../enums/species.enum';

/**
 * Wilke (1950) mixing rule for dilute-gas dynamic viscosity.
 * Refs: [Poling5] §9-5; Bird–Stewart–Lightfoot.
 */
export class WilkeViscosity {
  /**
   * μ_mix = Σ yᵢ μᵢ / Σ yⱼ φᵢⱼ [Pa·s].
   * φᵢⱼ from pure viscosities and molar masses.
   */
  static mix(
    species: Species[],
    moleFractions: Partial<Record<Species, number>>,
    mu_i: Record<string, number>,
  ): number {
    let mu_mix = 0;
    for (const i of species) {
      const yi = moleFractions[i] ?? 0;
      const Mi = GAS_REGISTRY[i].Mr;
      let denom = 0;
      for (const j of species) {
        const yj = moleFractions[j] ?? 0;
        const Mj = GAS_REGISTRY[j].Mr;
        const phi = Math.pow(1 + Math.sqrt(mu_i[i] / mu_i[j]) * Math.pow(Mj / Mi, 0.25), 2)
          / Math.sqrt(8 * (1 + Mi / Mj));
        denom += yj * phi;
      }
      mu_mix += yi * mu_i[i] / denom;
    }
    return mu_mix;
  }
}
