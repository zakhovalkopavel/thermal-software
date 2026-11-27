import { BadRequestException, Injectable } from '@nestjs/common';
import { CALPHAD_ESTIMATE_CONSTANTS } from '../../constants/calphad-estimate.constants';
import { OXIDE_MELTING_POINTS_C } from '../../constants/oxide-melting-points.constants';
import { ConfidenceLevel } from '../../enums/confidence-level.enum';
import { PhaseEquilibriumMethod } from '../../enums/phase-equilibrium-method.enum';
import type { EutecticEntry } from '../../types/eutectic-entry.type';
import type { PhaseEquilibriumEngineInput } from '../../types/phase-equilibrium-engine-input.type';
import type { PhaseEquilibriumEngineResult } from '../../types/phase-equilibrium-engine-result.type';
import type { PhaseEquilibriumMeltingRange } from '../../types/phase-equilibrium-melting-range.type';
import { CalphadGibbsMinimizer } from '../../utils/calphad-gibbs-minimizer';
import { CalphadStagingLiquidProbe } from '../../utils/calphad-staging-liquid-probe';
import { ComponentProperties } from '../../utils/component-properties';
import { CrystalIdentification } from '../../utils/crystal-identification';
import { EutecticIndex } from '../../utils/eutectic-index';

const { minOxideShare_wt, eutecticLiquidusSpan_K, tmSolidusOffset_K, minTemperatureSpan_K, minPhasePercent, minReportedShare_wt } =
  CALPHAD_ESTIMATE_CONSTANTS;

/**
 * CALPHAD estimate ladder for the reacted matrix.
 *
 * Shipped:
 *   1–2. Gibbs minimisation (stoichiometric solids + NASA liquid; Abdul RK excess for CAS)
 *        when G(T) is available; Mao ionic P/Q still probe-only;
 *   3. eutectic anchored — NSRDS-NBS 61 eutectic as solidus, linear lever rule up to the liquidus;
 *   4–5. Tm estimate when no eutectic matches (LOW confidence).
 * Algorithm: docs/algorithms/phase-equilibrium/FULL_PHASE_EQUILIBRIUM.md
 */
@Injectable()
export class PhaseEquilibriumCalphadService {
  equilibrateMatrix(input: PhaseEquilibriumEngineInput): PhaseEquilibriumEngineResult {
    const bulk = this.normalize(input.composition);
    const warnings: string[] = [];
    const range = this.meltingRange(bulk, warnings);
    const staging = CalphadStagingLiquidProbe.probe(bulk, input.temperature_C, warnings);
    const gibbs = this.minimizeGibbs(bulk, input.temperature_C, warnings);
    if (gibbs) {
      return {
        ...gibbs,
        solidus_C: range.solidus_C,
        liquidus_C: range.liquidus_C,
        method: staging.method ?? PhaseEquilibriumMethod.CALPHAD_PARTIAL_EXCESS,
        confidence: staging.confidence ?? ConfidenceLevel.MEDIUM,
        warnings,
        status: staging.status,
      };
    }
    const liquidPercent = this.liquidPercent(input.temperature_C, range);
    const solidPercent = 100 - liquidPercent;
    const liquidComposition = this.liquidComposition(bulk, range, liquidPercent);
    const solidComposition = this.solidComposition(bulk, liquidComposition, liquidPercent);
    return {
      liquidPercent,
      solidPercent,
      liquidComposition,
      solidComposition,
      solidus_C: range.solidus_C,
      liquidus_C: range.liquidus_C,
      crystals: CrystalIdentification.identify(solidComposition, solidPercent),
      method: staging.method ?? range.method,
      confidence: staging.confidence ?? range.confidence,
      warnings,
      status: staging.status,
    };
  }

  /**
   * Rungs 1–2: stoichiometric solids + oxide liquid Gibbs minimisation (`nelderMead`),
   * with Abdul Redlich–Kister excess for CAS. Falls back to the eutectic / Tm lever
   * when G data or the solve is insufficient.
   */
  private minimizeGibbs(
    composition: Record<string, number>,
    temperature_C: number,
    warnings: string[],
  ): Pick<
    PhaseEquilibriumEngineResult,
    'liquidPercent' | 'solidPercent' | 'liquidComposition' | 'solidComposition' | 'crystals'
  > | undefined {
    try {
      const solution = CalphadGibbsMinimizer.minimize(composition, temperature_C);
      if (!solution) {
        warnings.push(
          'Gibbs minimisation skipped: incomplete solid/liquid G(T) for the matrix oxides, or residual too large',
        );
        return undefined;
      }
      warnings.push(
        `Gibbs minimisation (oxide liquid + stoichiometric solids) converged; residual ${solution.residualMax_mol.toExponential(2)} mol`,
      );
      if (solution.usedAssociateSpeciation) {
        warnings.push(
          'Abdul 2023 associate speciation (ASL/CSL/C2SL/C3AL/CAS2L + oxide end-members) is in the liquid objective',
        );
      } else if (solution.usedMaoIonic) {
        warnings.push(
          'Mao 2006 ionic P–Q site-fraction speciation is in the liquid objective (missing reciprocal corners use oxideG + uplift)',
        );
      } else if (solution.usedAbdulExcess) {
        warnings.push(
          'Abdul 2023 Redlich–Kister excess among ALL–CAOL–SIO2L is in the liquid objective; associate/ionic speciation did not converge',
        );
      } else {
        warnings.push('liquidExcessIncomplete: ideal oxide mixing (no ionic/associate excess in the objective)');
      }
      return {
        liquidPercent: solution.liquidPercent,
        solidPercent: solution.solidPercent,
        liquidComposition: solution.liquidComposition,
        solidComposition: solution.solidComposition,
        crystals: solution.crystals,
      };
    } catch (error) {
      warnings.push(
        `Gibbs minimisation failed: ${error instanceof Error ? error.message : String(error)}`,
      );
      return undefined;
    }
  }

  /** Rung 3 when a eutectic matches the oxides present, otherwise rung 4. */
  private meltingRange(bulk: Record<string, number>, warnings: string[]): PhaseEquilibriumMeltingRange {
    const oxides = Object.keys(bulk).filter(k => bulk[k] > minOxideShare_wt && EutecticIndex.looksLikeOxideOrFluoride(k));
    const eutectic = EutecticIndex.bestMatch(oxides, bulk);
    if (eutectic) return this.eutecticRange(eutectic, bulk, oxides, warnings);
    warnings.push(
      `No eutectic data for ${oxides.join('-')}: solidus and liquidus estimated from component melting points (low confidence)`,
    );
    return this.tmRange(bulk, oxides);
  }

  private eutecticRange(
    eutectic: EutecticEntry,
    bulk: Record<string, number>,
    oxides: string[],
    warnings: string[],
  ): PhaseEquilibriumMeltingRange {
    const solidus_C = eutectic.temperature_C;
    const exact = EutecticIndex.isExactMatch(eutectic, oxides);
    if (!exact) {
      warnings.push(
        `Eutectic of subsystem ${eutectic.system} (${eutectic.temperature_C} °C) used; other matrix oxides do not shift the solidus`,
      );
    }
    const confidence = exact && !eutectic.approximateTemperature ? ConfidenceLevel.HIGH : ConfidenceLevel.MEDIUM;
    return {
      solidus_C,
      liquidus_C: Math.max(solidus_C + eutecticLiquidusSpan_K, this.meltingEstimate(bulk)),
      eutecticComposition: EutecticIndex.weightComposition(eutectic),
      method: PhaseEquilibriumMethod.EUTECTIC_ANCHORED,
      confidence,
    };
  }

  private tmRange(bulk: Record<string, number>, oxides: string[]): PhaseEquilibriumMeltingRange {
    const melting = oxides.map(k => this.componentMelting(k)).filter(t => t !== undefined);
    if (melting.length === 0) {
      throw new BadRequestException(`No melting data for matrix components: ${Object.keys(bulk).join(', ')}`);
    }
    return {
      solidus_C: Math.min(...melting) - tmSolidusOffset_K,
      liquidus_C: Math.max(...melting),
      eutecticComposition: {},
      method: PhaseEquilibriumMethod.TM_ESTIMATE,
      confidence: ConfidenceLevel.LOW,
    };
  }

  private meltingEstimate(bulk: Record<string, number>): number {
    let weighted = 0;
    let weight = 0;
    for (const [formula, wt] of Object.entries(bulk)) {
      const tm = this.componentMelting(formula);
      if (tm === undefined) continue;
      weighted += wt * tm;
      weight += wt;
    }
    return weight > 0 ? weighted / weight : 0;
  }

  private componentMelting(formula: string): number | undefined {
    return OXIDE_MELTING_POINTS_C[formula] ?? ComponentProperties.get(formula)?.meltingPoint_C;
  }

  private liquidPercent(temperature_C: number, range: PhaseEquilibriumMeltingRange): number {
    if (temperature_C <= range.solidus_C) return 0;
    if (temperature_C >= range.liquidus_C) return 100;
    const span = Math.max(range.liquidus_C - range.solidus_C, minTemperatureSpan_K);
    return (100 * (temperature_C - range.solidus_C)) / span;
  }

  private liquidComposition(
    bulk: Record<string, number>,
    range: PhaseEquilibriumMeltingRange,
    liquidPercent: number,
  ): Record<string, number> {
    if (liquidPercent < minPhasePercent) return {};
    if (liquidPercent >= 100 - minPhasePercent) return this.clean(bulk);
    const f = liquidPercent / 100;
    const eutectic = range.eutecticComposition;
    if (Object.keys(eutectic).length === 0) {
      return this.normalize(ComponentProperties.liquidCompositionWithEnrichment(bulk));
    }
    const keys = new Set([...Object.keys(bulk), ...Object.keys(eutectic)]);
    const blend = Object.fromEntries([...keys].map(k => [k, (1 - f) * (eutectic[k] ?? 0) + f * (bulk[k] ?? 0)]));
    return this.normalize(blend);
  }

  private solidComposition(
    bulk: Record<string, number>,
    liquid: Record<string, number>,
    liquidPercent: number,
  ): Record<string, number> {
    if (liquidPercent >= 100 - minPhasePercent) return {};
    if (liquidPercent < minPhasePercent) return this.clean(bulk);
    const f = liquidPercent / 100;
    const solid = Object.fromEntries(
      Object.entries(bulk).map(([k, wt]) => [k, Math.max(0, wt - f * (liquid[k] ?? 0)) / (1 - f)]),
    );
    return this.normalize(solid);
  }

  private normalize(composition: Record<string, number>): Record<string, number> {
    const total = Object.values(composition).reduce((sum, v) => sum + Math.max(v, 0), 0);
    if (total <= CALPHAD_ESTIMATE_CONSTANTS.emptyCompositionTotal) {
      throw new BadRequestException('Matrix composition must have a positive total');
    }
    return this.clean(Object.fromEntries(Object.entries(composition).map(([k, v]) => [k, (100 * Math.max(v, 0)) / total])));
  }

  private clean(composition: Record<string, number>): Record<string, number> {
    return Object.fromEntries(Object.entries(composition).filter(([, v]) => v > minReportedShare_wt));
  }
}
