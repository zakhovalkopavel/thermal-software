import { PHYSICAL_CONSTANTS } from '../../../common/thermal/constants/physical.constants';
import { celsiusToKelvin } from '../../../common/thermal/utils/temperature/celsius-to-kelvin.util';
import { LIQUID_SPECIATION_CONSTANTS } from '../constants/liquid-speciation.constants';
import type { AbdulAssociateSpecies } from '../types/abdul-associate-species.type';
import type { LiquidSpeciationResult } from '../types/liquid-speciation-result.type';
import { AbdulLiquid } from './abdul-liquid';

const { softplusFloor_mol } = LIQUID_SPECIATION_CONSTANTS;
const R = PHYSICAL_CONSTANTS.GAS_CONSTANT_J_MOLK;

const ALL_SPECIES: AbdulAssociateSpecies[] = [
  'ALL', 'CAOL', 'SIO2L', 'ASL', 'CSL', 'C2SL', 'C3AL', 'CAS2L',
];

/**
 * Abdul 2023 associate-liquid speciation for CaO–Al2O3–SiO2.
 * Greedy closed-form fill of associates (no nested optimiser) so the outer Gibbs
 * `nelderMead` stays tractable; G = Σ nᵢ°Gᵢ + RT Σ nᵢ ln xᵢ + L excess.
 */
export class AbdulAssociateSpeciation {
  /**
   * Excess Gibbs [J] of the liquid batch vs ideal mixing of oxide end-members ALL/CAOL/SIO2L.
   * Returns `undefined` when the matrix is outside CAS or end-member G is incomplete.
   */
  static excessGibbs_J(
    liquidOxideMoles: Record<string, number>,
    temperature_C: number,
  ): LiquidSpeciationResult | undefined {
    if (!AbdulLiquid.coversCas(liquidOxideMoles)) return undefined;
    const nA = liquidOxideMoles.Al2O3 ?? 0;
    const nC = liquidOxideMoles.CaO ?? 0;
    const nS = liquidOxideMoles.SiO2 ?? 0;
    if (nA + nC + nS <= softplusFloor_mol) return undefined;

    const gMap = AbdulAssociateSpeciation.endmemberG_Jmol(temperature_C);
    if (!gMap) return undefined;

    const moles = AbdulAssociateSpeciation.greedySpeciation(nA, nC, nS);
    const gibbs_J = AbdulAssociateSpeciation.gibbsOf(moles, gMap, temperature_C);
    const ideal = AbdulAssociateSpeciation.gibbsOf(
      { ALL: 2 * nA, CAOL: nC, SIO2L: nS, ASL: 0, CSL: 0, C2SL: 0, C3AL: 0, CAS2L: 0 },
      gMap,
      temperature_C,
    );
    if (!Number.isFinite(gibbs_J) || !Number.isFinite(ideal)) return undefined;
    return { gibbs_J, excessGibbs_J: gibbs_J - ideal };
  }

  /** Prefer CSL, then C2SL, ASL, C3AL, CAS2L while residuals stay non-negative. */
  private static greedySpeciation(
    nA: number,
    nC: number,
    nS: number,
  ): Record<AbdulAssociateSpecies, number> {
    let c = nC;
    let s = nS;
    let a = nA;
    const take = (needC: number, needS: number, needA: number, maxWanted: number): number => {
      const maxByC = needC > 0 ? c / needC : Infinity;
      const maxByS = needS > 0 ? s / needS : Infinity;
      const maxByA = needA > 0 ? a / needA : Infinity;
      const n = Math.min(maxWanted, maxByC, maxByS, maxByA);
      if (n <= softplusFloor_mol) return 0;
      c -= n * needC;
      s -= n * needS;
      a -= n * needA;
      return n;
    };
    const csl = take(1, 1, 0, nC);
    const c2sl = take(2, 1, 0, nC);
    const asl = take(0, 1, 1 / 3, nS);
    const c3al = take(3, 0, 0.5, nC);
    const cas2l = take(0.5, 1, 0.25, nS);
    return {
      CSL: csl,
      C2SL: c2sl,
      ASL: asl,
      C3AL: c3al,
      CAS2L: cas2l,
      ALL: Math.max(0, 2 * a),
      CAOL: Math.max(0, c),
      SIO2L: Math.max(0, s),
    };
  }

  private static gibbsOf(
    moles: Record<AbdulAssociateSpecies, number>,
    gMap: Record<AbdulAssociateSpecies, number>,
    temperature_C: number,
  ): number {
    const positive: Partial<Record<AbdulAssociateSpecies, number>> = {};
    for (const sp of ALL_SPECIES) {
      const n = moles[sp];
      if (n > softplusFloor_mol) positive[sp] = n;
    }
    const total = Object.values(positive).reduce((sum, n) => sum + n, 0);
    if (total <= softplusFloor_mol) return 0;
    const T_K = celsiusToKelvin(temperature_C);
    let G = 0;
    for (const [sp, n] of Object.entries(positive) as [AbdulAssociateSpecies, number][]) {
      G += n * (gMap[sp] + R * T_K * Math.log(n / total));
    }
    return G + AbdulAssociateSpeciation.excessL_Jmol(positive, total, temperature_C) * total;
  }

  private static excessL_Jmol(
    moles: Record<string, number>,
    total: number,
    temperature_C: number,
  ): number {
    const y = Object.fromEntries(Object.entries(moles).map(([sp, n]) => [sp, n / total]));
    let gEx = 0;
    for (const row of AbdulLiquid.excessParameters()) {
      const match = row.parameter.match(/^L\(LIQUID,([A-Z0-9]+),([A-Z0-9]+);(\d+)\)$/);
      if (!match) continue;
      const a = match[1];
      const b = match[2];
      if (!(a in y) || !(b in y)) continue;
      const L = AbdulLiquid.evaluateParameter(row, temperature_C);
      if (!Number.isFinite(L)) continue;
      gEx += y[a] * y[b] * L * (y[a] - y[b]) ** Number(match[3]);
    }
    return gEx;
  }

  private static endmemberG_Jmol(
    temperature_C: number,
  ): Record<AbdulAssociateSpecies, number> | undefined {
    const out = {} as Record<AbdulAssociateSpecies, number>;
    for (const sp of ALL_SPECIES) {
      const row = AbdulLiquid.endmemberParameters().find(r => r.parameter === `G(LIQUID,${sp};0)`);
      if (!row) return undefined;
      const g = AbdulLiquid.evaluateParameter(row, temperature_C);
      if (!Number.isFinite(g)) return undefined;
      out[sp] = g;
    }
    return out;
  }
}
