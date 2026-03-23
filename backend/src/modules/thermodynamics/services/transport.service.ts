import { Injectable } from '@nestjs/common';
import { Common } from '../../../common/thermal/utils/common';
import { GAS_REGISTRY } from '../../../common/thermal/compound/gas/registry';
import { Species } from '../enums/species.enum';

@Injectable()
export class TransportService {

  /**
   * Dynamic viscosity of a pure species via Sutherland's law [Pa·s]
   * μ = μ0·(T/T0)^1.5·(T0+S)/(T+S)
   * Source: [Leg] furnaceCombustion/classes/TransportProperties.js
   */
  viscosity(species: Species, T_K: number): number {
    const p = GAS_REGISTRY[species]?.sutherlandParams;
    if (!p) throw new Error(`No Sutherland parameters for ${species}`);
    return p.mu0 * Math.pow(T_K / p.T0, 1.5) * (p.T0 + p.S) / (T_K + p.S);
  }

  /**
   * Mixture dynamic viscosity via Wilke's mixing rule [Pa·s]
   * Source: [Leg] furnaceCombustion/classes/TransportProperties.js
   */
  viscosityMix(moleFractions: Partial<Record<Species, number>>, T_K: number): number {
    const species = (Object.keys(moleFractions) as Species[])
      .filter(sp => (moleFractions[sp] ?? 0) > 0 && GAS_REGISTRY[sp]?.sutherlandParams);
    const mu_i: Record<string, number> = {};
    for (const sp of species) mu_i[sp] = this.viscosity(sp, T_K);

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

  /**
   * Thermal conductivity of a pure species via Eucken-type relation [W/(m·K)]
   * λ = (Cp_mol + 1.25·R)·μ / M
   * Source: [Leg] furnaceCombustion/classes/TransportProperties.js
   */
  thermalConductivity(species: Species, T_K: number, Cp_J_molK: number): number {
    const mu = this.viscosity(species, T_K);
    const M  = GAS_REGISTRY[species].Mr;
    return (Cp_J_molK + 1.25 * Common.R) * mu / M;
  }

  /**
   * Mixture thermal conductivity (simple mole-fraction-weighted) [W/(m·K)]
   * Source: [Leg] furnaceCombustion/classes/TransportProperties.js
   */
  thermalConductivityMix(
    moleFractions: Partial<Record<Species, number>>,
    T_K: number,
    cpBySpecies: Partial<Record<Species, number>>,
  ): number {
    const species = (Object.keys(moleFractions) as Species[])
      .filter(sp => (moleFractions[sp] ?? 0) > 0 && GAS_REGISTRY[sp]?.sutherlandParams);
    let num = 0; let den = 0;
    for (const sp of species) {
      const y  = moleFractions[sp] ?? 0;
      const Cp = cpBySpecies[sp] ?? 30.0;
      num += y * this.thermalConductivity(sp, T_K, Cp);
      den += y;
    }
    return den > 0 ? num / den : 0;
  }
}
