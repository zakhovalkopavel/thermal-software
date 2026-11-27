import { molarMassGramsPerMol } from '../../../common/chemistry/compounds/molar-mass-grams-per-mol.util';
import { CompoundLiquidValue } from '../../../common/thermal/utils/compound-data/compound-liquid-value';
import { CompoundValueBuilder } from '../../../common/thermal/utils/compound-data/compound-value-builder';
import { CompoundPropertyResolver } from '../../../common/thermal/utils/compound-properties/compound-property-resolver';
import { CALPHAD_CANDIDATE_SOLIDS } from '../data/calphad-candidate-solids.data';
import { CALPHAD_LIQUID_ENDMEMBERS } from '../data/calphad-liquid-endmembers.data';
import type { CalphadCandidateSolid } from '../types/calphad-candidate-solid.type';

/**
 * Molar Gibbs energies of Engine C candidate solids and liquid oxide end-members
 * via `CompoundPropertyResolver` (NASA or Cp-integral). Stateless cache with `resetCache()`.
 */
export class CalphadPhaseGibbs {
  private static solidCache = new Map<string, number | undefined>();
  private static liquidCache = new Map<string, number | undefined>();

  /** Candidates spannable by the given oxide set that have a finite G at T. */
  static usableSolids(oxides: readonly string[], temperature_K: number): CalphadCandidateSolid[] {
    const available = new Set(oxides);
    return CALPHAD_CANDIDATE_SOLIDS.filter(candidate => {
      const keys = Object.keys(candidate.oxides);
      if (!keys.every(oxide => available.has(oxide))) return false;
      return Number.isFinite(CalphadPhaseGibbs.solidGibbs_Jmol(candidate.compoundId, temperature_K));
    });
  }

  /** Liquid end-member G [J/mol] for each oxide that has a NASA liquid key; undefined if any is missing. */
  static liquidGibbsMap_Jmol(
    oxides: readonly string[],
    temperature_K: number,
  ): Record<string, number> | undefined {
    const out: Record<string, number> = {};
    for (const oxide of oxides) {
      const row = CALPHAD_LIQUID_ENDMEMBERS.find(entry => entry.oxide === oxide);
      if (!row) return undefined;
      const G = CalphadPhaseGibbs.liquidGibbs_Jmol(row.compoundId, row.nasa9Key, temperature_K);
      if (!Number.isFinite(G)) return undefined;
      out[oxide] = G as number;
    }
    return out;
  }

  static solidGibbs_Jmol(compoundId: string, temperature_K: number): number | undefined {
    const key = `${compoundId}@${temperature_K}`;
    if (CalphadPhaseGibbs.solidCache.has(key)) return CalphadPhaseGibbs.solidCache.get(key);
    let value: number | undefined;
    try {
      const compound = CompoundValueBuilder.forSolid(compoundId);
      const G = new CompoundPropertyResolver(compound).gibbsEnergy(temperature_K);
      value = Number.isFinite(G) ? G : undefined;
    } catch {
      value = undefined;
    }
    CalphadPhaseGibbs.solidCache.set(key, value);
    return value;
  }

  static liquidGibbs_Jmol(compoundId: string, nasa9Key: string, temperature_K: number): number | undefined {
    const key = `${compoundId}:${nasa9Key}@${temperature_K}`;
    if (CalphadPhaseGibbs.liquidCache.has(key)) return CalphadPhaseGibbs.liquidCache.get(key);
    let value: number | undefined;
    try {
      const compound = CompoundLiquidValue.fromId(compoundId, nasa9Key);
      const G = new CompoundPropertyResolver(compound).gibbsEnergy(temperature_K);
      value = Number.isFinite(G) ? G : undefined;
    } catch {
      value = undefined;
    }
    CalphadPhaseGibbs.liquidCache.set(key, value);
    return value;
  }

  /** Oxide moles in a 100 g batch from composition [wt%]. */
  static oxideMolesFromWt(composition_wt: Record<string, number>): Record<string, number> {
    return Object.fromEntries(
      Object.entries(composition_wt).map(([oxide, wt]) => [oxide, wt / molarMassGramsPerMol(oxide)]),
    );
  }

  /** Mass [g] of oxide moles. */
  static oxideMass_g(moles: Record<string, number>): number {
    return Object.entries(moles).reduce((sum, [oxide, n]) => sum + n * molarMassGramsPerMol(oxide), 0);
  }

  static resetCache(): void {
    CalphadPhaseGibbs.solidCache.clear();
    CalphadPhaseGibbs.liquidCache.clear();
  }
}
