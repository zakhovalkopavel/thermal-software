import { ConfidenceLevel } from '../enums/confidence-level.enum';
import { PhaseEquilibriumMethod } from '../enums/phase-equilibrium-method.enum';
import type { CalphadStagingProbe } from '../types/calphad-staging-probe.type';
import { AbdulLiquid } from './abdul-liquid';
import { MaoLiquid } from './mao-liquid';

/**
 * Probes Abdul associate and Mao ionic CAS staging when the matrix is CaO–Al2O3–SiO2.
 * Does not change phase amounts — only method / confidence / warnings.
 */
export class CalphadStagingLiquidProbe {
  static probe(
    bulk: Record<string, number>,
    temperature_C: number,
    warnings: string[],
  ): CalphadStagingProbe {
    const abdul = CalphadStagingLiquidProbe.abdul(bulk, temperature_C, warnings);
    const mao = CalphadStagingLiquidProbe.mao(bulk, temperature_C, warnings);
    if (abdul || mao) {
      return {
        method: PhaseEquilibriumMethod.CALPHAD_PARTIAL_EXCESS,
        confidence: ConfidenceLevel.MEDIUM,
        status: 'assessed',
      };
    }
    return { status: 'estimated' };
  }

  private static abdul(
    bulk: Record<string, number>,
    temperature_C: number,
    warnings: string[],
  ): boolean {
    if (!AbdulLiquid.coversCas(bulk)) return false;
    try {
      const endmembers = AbdulLiquid.endmemberParameters();
      if (endmembers.length === 0) {
        warnings.push('Abdul associate liquid staging has no endmemberG rows');
        return false;
      }
      const sample = AbdulLiquid.evaluateParameter(endmembers[0], temperature_C);
      if (!Number.isFinite(sample)) {
        warnings.push('Abdul liquid end-member G evaluation returned a non-finite value');
        return false;
      }
      warnings.push(
        'Abdul 2023 associate liquid end-member G is available for CAS (speciation preferred in Gibbs when it converges)',
      );
      return true;
    } catch (error) {
      warnings.push(
        `Abdul liquid functions could not be evaluated: ${error instanceof Error ? error.message : String(error)}`,
      );
      return false;
    }
  }

  private static mao(
    bulk: Record<string, number>,
    temperature_C: number,
    warnings: string[],
  ): boolean {
    if (!MaoLiquid.coversCas(bulk)) return false;
    try {
      const sample = MaoLiquid.oxideGibbs_Jmol('SiO2', temperature_C);
      if (!Number.isFinite(sample)) {
        warnings.push('Mao liquid oxideG evaluation returned a non-finite value');
        return false;
      }
      warnings.push(
        `Mao 2006 ionic CAS oxideG is evaluable (${MaoLiquid.endmemberCount()} endmembers, ${MaoLiquid.interactionCount()} interactions); P–Q speciation used in Gibbs when associate speciation does not converge`,
      );
      return true;
    } catch (error) {
      warnings.push(
        `Mao liquid oxideG could not be evaluated: ${error instanceof Error ? error.message : String(error)}`,
      );
      return false;
    }
  }
}
