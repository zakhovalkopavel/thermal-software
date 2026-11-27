import { molarMassGramsPerMol } from '../../../common/chemistry/compounds/molar-mass-grams-per-mol.util';
import { PHYSICAL_CONSTANTS } from '../../../common/thermal/constants/physical.constants';
import { celsiusToKelvin } from '../../../common/thermal/utils/temperature/celsius-to-kelvin.util';
import { nelderMead } from '../../../common/utils/optimization';
import { CALPHAD_GIBBS_CONSTANTS } from '../constants/calphad-gibbs.constants';
import type { CalphadCandidateSolid } from '../types/calphad-candidate-solid.type';
import type { CalphadGibbsSolution } from '../types/calphad-gibbs-solution.type';
import type { PhaseEquilibriumCrystal } from '../types/phase-equilibrium-crystal.type';
import { AbdulLiquid } from './abdul-liquid';
import { CalphadPhaseGibbs } from './calphad-phase-gibbs';
import { CasLiquidExcess } from './cas-liquid-excess';
import { MaoLiquid } from './mao-liquid';

const {
  softplusFloor_mol,
  massBalancePenalty,
  maxResidual_mol,
  maxIterations,
  tolerance,
  minReportedPhasePercent,
  minOxideShare_wt,
} = CALPHAD_GIBBS_CONSTANTS;

const R = PHYSICAL_CONSTANTS.GAS_CONSTANT_J_MOLK;

/**
 * Constrained Gibbs minimisation for stoichiometric solids + oxide liquid
 * (NASA ideal mixing + CAS liquid excess: Abdul associates → Mao ionic P–Q → oxide RK).
 * Mass balance is enforced with a quadratic penalty; amounts are softplus-parametrised
 * so `nelderMead` stays unconstrained.
 */
export class CalphadGibbsMinimizer {
  /**
   * Minimise G of a 100 g matrix batch at `temperature_C`.
   * Returns `undefined` when liquid end-member G is incomplete, no solid G exists,
   * or the residual after optimisation exceeds {@link CALPHAD_GIBBS_CONSTANTS.maxResidual_mol}.
   */
  static minimize(
    composition_wt: Record<string, number>,
    temperature_C: number,
  ): CalphadGibbsSolution | undefined {
    CasLiquidExcess.resetCache();
    const oxides = Object.keys(composition_wt).filter(k => composition_wt[k] > minOxideShare_wt);
    if (oxides.length === 0) return undefined;

    const T_K = celsiusToKelvin(temperature_C);
    const solids = CalphadPhaseGibbs.usableSolids(oxides, T_K);
    const liquidG = CalphadPhaseGibbs.liquidGibbsMap_Jmol(oxides, T_K);
    if (!liquidG || solids.length === 0) return undefined;
    const casLiquid = AbdulLiquid.coversCas(composition_wt) || MaoLiquid.coversCas(composition_wt);

    const target = CalphadPhaseGibbs.oxideMolesFromWt(
      Object.fromEntries(oxides.map(oxide => [oxide, composition_wt[oxide]])),
    );
    const solidG = solids.map(s => CalphadPhaseGibbs.solidGibbs_Jmol(s.compoundId, T_K) as number);
    const nSolid = solids.length;
    const nOxide = oxides.length;
    const x0 = [
      ...solids.map(() => -2),
      ...oxides.map(oxide => Math.log(Math.max(target[oxide], softplusFloor_mol))),
    ];

    const objective = (u: number[]): number => {
      const decoded = CalphadGibbsMinimizer.decode(u, nSolid, nOxide);
      return CalphadGibbsMinimizer.gibbsPlusPenalty(
        decoded.solidMoles,
        decoded.liquidMoles,
        solids,
        solidG,
        oxides,
        liquidG,
        target,
        T_K,
        temperature_C,
        casLiquid,
      );
    };

    const { x } = nelderMead(objective, x0, { maxIterations, tolerance });
    const decoded = CalphadGibbsMinimizer.decode(x, nSolid, nOxide);
    const residual = CalphadGibbsMinimizer.residual(
      decoded.solidMoles,
      decoded.liquidMoles,
      solids,
      oxides,
      target,
    );
    const residualMax = Math.max(...Object.values(residual).map(Math.abs), 0);
    if (residualMax > maxResidual_mol) return undefined;

    return CalphadGibbsMinimizer.toSolution(
      decoded.solidMoles,
      decoded.liquidMoles,
      solids,
      oxides,
      solidG,
      liquidG,
      T_K,
      residualMax,
      temperature_C,
      casLiquid,
    );
  }

  private static decode(
    u: number[],
    nSolid: number,
    nOxide: number,
  ): { solidMoles: number[]; liquidMoles: number[] } {
    return {
      solidMoles: u.slice(0, nSolid).map(CalphadGibbsMinimizer.softplus),
      liquidMoles: u.slice(nSolid, nSolid + nOxide).map(CalphadGibbsMinimizer.softplus),
    };
  }

  private static softplus(u: number): number {
    if (u > 30) return u;
    if (u < -30) return softplusFloor_mol;
    return Math.log1p(Math.exp(u));
  }

  private static gibbsPlusPenalty(
    solidMoles: number[],
    liquidMoles: number[],
    solids: readonly CalphadCandidateSolid[],
    solidG: readonly number[],
    oxides: readonly string[],
    liquidG: Record<string, number>,
    target: Record<string, number>,
    T_K: number,
    temperature_C: number,
    casLiquid: boolean,
  ): number {
    let G = 0;
    for (let i = 0; i < solids.length; i++) G += solidMoles[i] * solidG[i];

    const liquidTotal = liquidMoles.reduce((sum, n) => sum + n, 0);
    if (liquidTotal > softplusFloor_mol) {
      for (let i = 0; i < oxides.length; i++) {
        const n = liquidMoles[i];
        if (n <= softplusFloor_mol) continue;
        const x = n / liquidTotal;
        G += n * (liquidG[oxides[i]] + R * T_K * Math.log(x));
      }
      if (casLiquid) {
        const liquidOxideMoles = Object.fromEntries(oxides.map((oxide, i) => [oxide, liquidMoles[i]]));
        G += CasLiquidExcess.evaluate(liquidOxideMoles, temperature_C).excessGibbs_J;
      }
    }

    const residual = CalphadGibbsMinimizer.residual(solidMoles, liquidMoles, solids, oxides, target);
    let penalty = 0;
    for (const value of Object.values(residual)) penalty += value * value;
    return G + massBalancePenalty * penalty;
  }

  private static residual(
    solidMoles: number[],
    liquidMoles: number[],
    solids: readonly CalphadCandidateSolid[],
    oxides: readonly string[],
    target: Record<string, number>,
  ): Record<string, number> {
    const out: Record<string, number> = {};
    for (let i = 0; i < oxides.length; i++) {
      const oxide = oxides[i];
      let predicted = liquidMoles[i];
      for (let s = 0; s < solids.length; s++) {
        predicted += solidMoles[s] * (solids[s].oxides[oxide] ?? 0);
      }
      out[oxide] = predicted - target[oxide];
    }
    return out;
  }

  private static toSolution(
    solidMoles: number[],
    liquidMoles: number[],
    solids: readonly CalphadCandidateSolid[],
    oxides: readonly string[],
    solidG: readonly number[],
    liquidG: Record<string, number>,
    T_K: number,
    residualMax_mol: number,
    temperature_C: number,
    casLiquid: boolean,
  ): CalphadGibbsSolution {
    const liquidOxideMoles = Object.fromEntries(oxides.map((oxide, i) => [oxide, liquidMoles[i]]));
    const solidOxideMoles: Record<string, number> = Object.fromEntries(oxides.map(oxide => [oxide, 0]));
    for (let s = 0; s < solids.length; s++) {
      for (const [oxide, stoich] of Object.entries(solids[s].oxides)) {
        solidOxideMoles[oxide] = (solidOxideMoles[oxide] ?? 0) + solidMoles[s] * stoich;
      }
    }

    const liquidMass = CalphadPhaseGibbs.oxideMass_g(liquidOxideMoles);
    const solidMass = CalphadPhaseGibbs.oxideMass_g(solidOxideMoles);
    const totalMass = liquidMass + solidMass;
    let liquidPercent = totalMass > 0 ? (100 * liquidMass) / totalMass : 0;
    let solidPercent = 100 - liquidPercent;
    if (liquidPercent < minReportedPhasePercent) {
      liquidPercent = 0;
      solidPercent = 100;
    } else if (solidPercent < minReportedPhasePercent) {
      liquidPercent = 100;
      solidPercent = 0;
    }

    const liquidComposition =
      liquidPercent <= 0 ? {} : CalphadGibbsMinimizer.normalizeWt(liquidOxideMoles, liquidMass);
    const solidComposition =
      solidPercent <= 0 ? {} : CalphadGibbsMinimizer.normalizeWt(solidOxideMoles, solidMass);

    const crystals: PhaseEquilibriumCrystal[] = [];
    if (solidPercent > 0) {
      const solidMassFromPhases = solids.reduce(
        (sum, solid, i) => sum + solidMoles[i] * CalphadPhaseGibbs.oxideMass_g(solid.oxides),
        0,
      );
      for (let i = 0; i < solids.length; i++) {
        if (solidMoles[i] <= softplusFloor_mol) continue;
        const mass = solidMoles[i] * CalphadPhaseGibbs.oxideMass_g(solids[i].oxides);
        const percent = solidMassFromPhases > 0 ? (solidPercent * mass) / solidMassFromPhases : 0;
        if (percent < minReportedPhasePercent) continue;
        crystals.push({
          phaseId: solids[i].phaseId,
          phase: solids[i].phase,
          formula: solids[i].formula,
          percent,
        });
      }
    }

    const excess = casLiquid
      ? CasLiquidExcess.evaluate(liquidOxideMoles, temperature_C)
      : { excessGibbs_J: 0, mode: 'none' as const };

    let gibbs_J = 0;
    for (let i = 0; i < solids.length; i++) gibbs_J += solidMoles[i] * solidG[i];
    const liquidTotal = liquidMoles.reduce((sum, n) => sum + n, 0);
    if (liquidTotal > softplusFloor_mol) {
      for (let i = 0; i < oxides.length; i++) {
        const n = liquidMoles[i];
        if (n <= softplusFloor_mol) continue;
        gibbs_J += n * (liquidG[oxides[i]] + R * T_K * Math.log(n / liquidTotal));
      }
      gibbs_J += excess.excessGibbs_J;
    }

    return {
      liquidPercent,
      solidPercent,
      liquidComposition,
      solidComposition,
      crystals,
      gibbs_J,
      residualMax_mol,
      usedAbdulExcess: excess.mode === 'abdul_rk',
      usedAssociateSpeciation: excess.mode === 'associate',
      usedMaoIonic: excess.mode === 'mao_ionic',
    };
  }

  private static normalizeWt(moles: Record<string, number>, mass_g: number): Record<string, number> {
    if (mass_g <= 0) return {};
    return Object.fromEntries(
      Object.entries(moles)
        .map(([oxide, n]) => [oxide, (100 * n * molarMassGramsPerMol(oxide)) / mass_g] as [string, number])
        .filter(([, wt]) => wt > minOxideShare_wt),
    );
  }
}
