import { PHYSICAL_CONSTANTS } from '../../../common/thermal/constants/physical.constants';
import { celsiusToKelvin } from '../../../common/thermal/utils/temperature/celsius-to-kelvin.util';
import { LIQUID_SPECIATION_CONSTANTS } from '../constants/liquid-speciation.constants';
import type { LiquidSpeciationResult } from '../types/liquid-speciation-result.type';
import type { MaoSiteFractions } from '../types/mao-site-fractions.type';
import { MaoEndmemberExpression } from './mao-endmember-expression';
import { MaoIonicExcess } from './mao-ionic-excess';
import { MaoLiquid } from './mao-liquid';
import { MaoLiquidDataset } from './mao-liquid-dataset';

const { softplusFloor_mol, missingEndmemberUplift_Jmol } = LIQUID_SPECIATION_CONSTANTS;
const R = PHYSICAL_CONSTANTS.GAS_CONSTANT_J_MOLK;

type Cation = 'Al' | 'Ca';
type Anion = 'AlO2' | 'O' | 'SiO4' | 'SiO2';

/**
 * Mao 2006 ionic two-sublattice liquid: (Al³⁺,Ca²⁺)_P (AlO₂⁻,O²⁻,SiO₄⁴⁻,SiO₂⁰)_Q.
 * Closed-form site fractions from oxide moles (no nested optimiser) for Gibbs speed.
 */
export class MaoIonicSpeciation {
  /**
   * Excess Gibbs [J] vs ideal mixing of Mao oxideG end-members for the liquid batch.
   * Returns `undefined` outside CAS or when oxideG cannot be evaluated.
   */
  static excessGibbs_J(
    liquidOxideMoles: Record<string, number>,
    temperature_C: number,
  ): LiquidSpeciationResult | undefined {
    if (!MaoLiquid.coversCas(liquidOxideMoles)) return undefined;
    const nA = liquidOxideMoles.Al2O3 ?? 0;
    const nC = liquidOxideMoles.CaO ?? 0;
    const nS = liquidOxideMoles.SiO2 ?? 0;
    const nOx = nA + nC + nS;
    if (nOx <= softplusFloor_mol) return undefined;

    let gAl: number;
    let gCa: number;
    let gSi: number;
    try {
      gAl = MaoLiquid.oxideGibbs_Jmol('Al2O3', temperature_C);
      gCa = MaoLiquid.oxideGibbs_Jmol('CaO', temperature_C);
      gSi = MaoLiquid.oxideGibbs_Jmol('SiO2', temperature_C);
    } catch {
      return undefined;
    }

    const sites = MaoIonicSpeciation.sitesFromOxides(nA, nC, nS);
    const corners = MaoIonicSpeciation.cornerG(gAl, gCa, gSi);
    const gibbs_J = MaoIonicSpeciation.gibbs_Jmol(sites, corners, temperature_C) * nOx;
    const ideal = MaoIonicSpeciation.idealOxideGibbs_J(nA, nC, nS, gAl, gCa, gSi, temperature_C);
    if (!Number.isFinite(gibbs_J) || !Number.isFinite(ideal)) return undefined;
    return { gibbs_J, excessGibbs_J: gibbs_J - ideal };
  }

  /** Map oxide moles to site fractions: Al→AlO2, Ca→O, Si→SiO2 (SiO4 kept small). */
  private static sitesFromOxides(nA: number, nC: number, nS: number): MaoSiteFractions {
    const al = Math.max(nA, softplusFloor_mol);
    const ca = Math.max(nC, softplusFloor_mol);
    const si = Math.max(nS, softplusFloor_mol);
    const cSum = al + ca;
    const cations = { Al: al / cSum, Ca: ca / cSum };
    const aAlO2 = al;
    const aO = ca;
    const aSiO2 = si;
    const aSiO4 = softplusFloor_mol;
    const aSum = aAlO2 + aO + aSiO2 + aSiO4;
    const anions = {
      AlO2: aAlO2 / aSum,
      O: aO / aSum,
      SiO4: aSiO4 / aSum,
      SiO2: aSiO2 / aSum,
    };
    return {
      cations,
      anions,
      Q: Math.max(3 * cations.Al + 2 * cations.Ca, softplusFloor_mol),
      P: Math.max(anions.AlO2 + 2 * anions.O + 4 * anions.SiO4, softplusFloor_mol),
    };
  }

  private static gibbs_Jmol(
    sites: MaoSiteFractions,
    corners: Record<string, number>,
    temperature_C: number,
  ): number {
    const { cations, anions, P, Q } = sites;
    const T_K = celsiusToKelvin(temperature_C);
    let G = 0;
    for (const [c, yc] of Object.entries(cations) as [Cation, number][]) {
      for (const [a, ya] of Object.entries(anions) as [Anion, number][]) {
        G += yc * ya * (corners[`${c}:${a}`] ?? missingEndmemberUplift_Jmol);
      }
    }
    const ln = (x: number) => Math.log(Math.max(x, softplusFloor_mol));
    G += R * T_K * (
      P * (cations.Al * ln(cations.Al) + cations.Ca * ln(cations.Ca))
      + Q * (
        anions.AlO2 * ln(anions.AlO2)
        + anions.O * ln(anions.O)
        + anions.SiO4 * ln(anions.SiO4)
        + anions.SiO2 * ln(anions.SiO2)
      )
    );
    return G + MaoIonicExcess.excessL_Jmol(sites, temperature_C);
  }

  private static cornerG(gAl: number, gCa: number, gSi: number): Record<string, number> {
    const parsed: Record<string, number> = {};
    for (const row of MaoLiquidDataset.load().phases.liquid_ionic_CAS.endmembers as Array<{
      parameter: string;
      expressionRaw: string;
    }>) {
      const m = row.parameter.match(/^G(Al|Ca)\+[23]:(.+)$/);
      if (!m) continue;
      const anion = MaoIonicExcess.anionKey(m[2]);
      if (!anion) continue;
      parsed[`${m[1]}:${anion}`] = MaoEndmemberExpression.evaluate(row.expressionRaw, gAl, gCa, gSi);
    }
    for (const c of ['Al', 'Ca'] as Cation[]) {
      for (const a of ['AlO2', 'O', 'SiO4', 'SiO2'] as Anion[]) {
        const key = `${c}:${a}`;
        if (parsed[key] !== undefined) continue;
        parsed[key] = MaoIonicSpeciation.estimateCorner(c, a, gAl, gCa, gSi) + missingEndmemberUplift_Jmol;
      }
    }
    return parsed;
  }

  private static estimateCorner(c: Cation, a: Anion, gAl: number, gCa: number, gSi: number): number {
    if (c === 'Al' && a === 'AlO2') return 2 * gAl;
    if (c === 'Ca' && a === 'AlO2') return gAl + gCa;
    if (c === 'Al' && a === 'O') return gAl;
    if (c === 'Ca' && a === 'O') return 2 * gCa;
    if (c === 'Al' && a === 'SiO4') return 2 * gAl + 3 * gSi;
    if (c === 'Ca' && a === 'SiO4') return 2 * gCa + gSi;
    if (c === 'Al' && a === 'SiO2') return gAl + gSi;
    return gCa + gSi;
  }

  private static idealOxideGibbs_J(
    nA: number,
    nC: number,
    nS: number,
    gAl: number,
    gCa: number,
    gSi: number,
    temperature_C: number,
  ): number {
    const total = nA + nC + nS;
    const T_K = celsiusToKelvin(temperature_C);
    let G = nA * gAl + nC * gCa + nS * gSi;
    if (total > softplusFloor_mol) {
      if (nA > softplusFloor_mol) G += nA * R * T_K * Math.log(nA / total);
      if (nC > softplusFloor_mol) G += nC * R * T_K * Math.log(nC / total);
      if (nS > softplusFloor_mol) G += nS * R * T_K * Math.log(nS / total);
    }
    return G;
  }
}
