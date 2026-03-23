import { Injectable } from '@nestjs/common';
import { GAS_REGISTRY } from '../../../common/thermal/compound/gas/registry';
import { Species } from '../enums/species.enum';

@Injectable()
export class DiffusionService {

  /**
   * Omega_D collision integral — Neufeld et al. (1972) fit.
   * Source: [Leg] furnaceCombustion/classes/DiffusionCoefficients.js
   */
  private _omegaD(Tstar: number): number {
    const a=1.06036,b=0.15610,c=0.19300,d=0.47635,e=1.03587,f=1.52996,g=1.76474,h=3.89411;
    return a/Math.pow(Tstar,b) + c/Math.exp(d*Tstar) + e/Math.exp(f*Tstar) + g/Math.exp(h*Tstar);
  }

  /**
   * Binary diffusion coefficient D_12 [m²/s] via Chapman-Enskog theory.
   * D_12 = 0.00266·T^1.5 / (P·σ12²·Ω_D)   [cm²/s at P in atm]
   * σ and ε/k taken from compound registry (collisionDiameter, epsilonToKb).
   * Source: [Leg] furnaceCombustion/classes/DiffusionCoefficients.js
   * LJ params: Reid, Prausnitz & Poling (1987), Appendix A
   */
  binaryDiffusion(A: Species, B: Species, T_K: number, P_atm = 1.0): number {
    const sp1 = GAS_REGISTRY[A];
    const sp2 = GAS_REGISTRY[B];
    if (!sp1 || !sp2) throw new Error(`Unknown species: ${A} or ${B}`);
    const sigma12   = (sp1.collisionDiameter + sp2.collisionDiameter) / 2;
    const epsilon12 = Math.sqrt(sp1.epsilonToKb * sp2.epsilonToKb);
    const Omega_D   = this._omegaD(T_K / epsilon12);
    const D_cm2s    = 0.00266 * Math.pow(T_K, 1.5) / (P_atm * sigma12 * sigma12 * Omega_D);
    return D_cm2s * 1e-4; // cm²/s → m²/s
  }

  /**
   * Effective diffusion of species i in mixture via Wilke formula.
   * Source: [Leg] furnaceCombustion/classes/DiffusionCoefficients.js
   */
  effectiveDiffusion(
    species: Species,
    moleFractions: Partial<Record<Species, number>>,
    T_K: number,
    P_atm = 1.0,
  ): number {
    const yi = moleFractions[species] ?? 0;
    let denom = 0;
    for (const [sp, yj] of Object.entries(moleFractions) as [Species, number][]) {
      if (sp === species || !yj || yj <= 0) continue;
      const Dij = this.binaryDiffusion(species, sp, T_K, P_atm);
      denom += yj / Dij;
    }
    return denom > 0 ? (1 - yi) / denom : 0;
  }

  /** Effective diffusion for all tracked species in mixture */
  getAllDiffusionCoefficients(
    moleFractions: Partial<Record<Species, number>>,
    T_K: number,
    P_atm = 1.0,
  ): Partial<Record<Species, number>> {
    const result: Partial<Record<Species, number>> = {};
    for (const sp of Object.keys(moleFractions) as Species[]) {
      if (GAS_REGISTRY[sp]) result[sp] = this.effectiveDiffusion(sp, moleFractions, T_K, P_atm);
    }
    return result;
  }
}
