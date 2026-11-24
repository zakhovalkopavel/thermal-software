import { HelmholtzBinaryDefaults } from './helmholtz-binary-defaults';
import { CoolpropFluidEos } from '../../types/coolprop-fluid-eos.type';
import { HelmholtzReducingState } from '../../types/helmholtz-reducing-state.type';

/**
 * Kunz–Wagner / CoolProp multi-fluid reducing parameters T_r, ρ_r.
 * Missing CoolProp binary pairs use `HelmholtzBinaryDefaults` (LB or asymmetric γ_T).
 * Refs: [CoolProp], Kunz & Wagner GERG-2008.
 */
export class HelmholtzMixtureReducing {
  static reducing(
    keys: readonly string[],
    moleFractions: readonly number[],
    fluids: readonly CoolpropFluidEos[],
  ): HelmholtzReducingState {
    if (keys.length !== moleFractions.length || keys.length !== fluids.length) {
      throw new Error('Helmholtz reducing: keys, mole fractions, and fluids length mismatch');
    }
    const n = keys.length;
    let Tr = 0;
    let vr = 0;
    for (let i = 0; i < n; i++) {
      const yi = moleFractions[i];
      Tr += yi * yi * fluids[i].Tc;
      vr += yi * yi / fluids[i].rhoc;
    }
    for (let i = 0; i < n - 1; i++) {
      for (let j = i + 1; j < n; j++) {
        const yi = moleFractions[i];
        const yj = moleFractions[j];
        if (yi === 0 && yj === 0) continue;
        const { betaT, gammaT, betaV, gammaV } = HelmholtzBinaryDefaults.forPair(
          keys[i],
          keys[j],
          fluids[i].Tc,
          fluids[j].Tc,
        );
        const TcIj = Math.sqrt(fluids[i].Tc * fluids[j].Tc);
        const vcIj = 0.125 * (
          Math.cbrt(1 / fluids[i].rhoc) + Math.cbrt(1 / fluids[j].rhoc)
        ) ** 3;
        Tr += 2 * betaT * gammaT * TcIj * HelmholtzMixtureReducing.fYij(yi, yj, betaT);
        vr += 2 * betaV * gammaV * vcIj * HelmholtzMixtureReducing.fYij(yi, yj, betaV);
      }
    }
    if (Tr <= 0 || vr <= 0) {
      throw new Error('Helmholtz reducing: non-positive Tr or vr');
    }
    return { Tr, rhor: 1 / vr };
  }

  /** f_Y,ij = x_i x_j (x_i+x_j) / (β² x_i + x_j) */
  private static fYij(xi: number, xj: number, beta: number): number {
    if (xi === 0 && xj === 0) return 0;
    return xi * xj * (xi + xj) / (beta * beta * xi + xj);
  }
}
