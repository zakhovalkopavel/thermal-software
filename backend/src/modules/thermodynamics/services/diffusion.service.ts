import { Injectable } from '@nestjs/common';
import { GAS_REGISTRY } from '../../../common/thermal/compound/gas/registry';
import { Species } from '../enums/species.enum';
import { ChapmanEnskogDiffusion } from '../utils/viscosity/chapman-enskog-diffusion';

@Injectable()
export class DiffusionService {

  /**
   * Binary diffusion coefficient D_12 [m²/s] via Chapman–Enskog (Poling form).
   * σ [Å], ε/k [K], M [kg/mol] from the compound registry.
   * Refs: [Poling5] §11-3.
   */
  binaryDiffusion(A: Species, B: Species, T_K: number, P_atm = 1.0): number {
    const sp1 = GAS_REGISTRY[A];
    const sp2 = GAS_REGISTRY[B];
    if (!sp1 || !sp2) throw new Error(`Unknown species: ${A} or ${B}`);
    for (const [name, sp] of [[A, sp1], [B, sp2]] as const) {
      if (sp.collisionDiameter === undefined || sp.epsilonToKb === undefined) {
        throw new Error(`No Lennard-Jones parameters for ${name}`);
      }
    }
    return ChapmanEnskogDiffusion.binary(
      sp1.Mr,
      sp2.Mr,
      sp1.collisionDiameter!,
      sp2.collisionDiameter!,
      sp1.epsilonToKb!,
      sp2.epsilonToKb!,
      T_K,
      P_atm,
    );
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
