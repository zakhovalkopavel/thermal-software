import type { CasLiquidExcessMode } from '../types/cas-liquid-excess-mode.type';
import { AbdulAssociateSpeciation } from './abdul-associate-speciation';
import { AbdulLiquid } from './abdul-liquid';
import { AbdulLiquidExcess } from './abdul-liquid-excess';
import { MaoIonicSpeciation } from './mao-ionic-speciation';
import { MaoLiquid } from './mao-liquid';

type CacheEntry = { excessGibbs_J: number; mode: CasLiquidExcessMode };

/**
 * Chooses and evaluates CAS liquid excess for Engine C (associate → Mao → oxide RK).
 * Results are memoised for the current Gibbs solve so nested speciation is not
 * re-run on every outer `nelderMead` probe with the same liquid moles.
 */
export class CasLiquidExcess {
  private static cache = new Map<string, CacheEntry>();

  static resetCache(): void {
    CasLiquidExcess.cache.clear();
  }

  static evaluate(
    liquidOxideMoles: Record<string, number>,
    temperature_C: number,
  ): CacheEntry {
    const key = CasLiquidExcess.cacheKey(liquidOxideMoles, temperature_C);
    const hit = CasLiquidExcess.cache.get(key);
    if (hit) return hit;

    let result: CacheEntry = { excessGibbs_J: 0, mode: 'none' };
    if (AbdulLiquid.coversCas(liquidOxideMoles) || MaoLiquid.coversCas(liquidOxideMoles)) {
      const associate = AbdulAssociateSpeciation.excessGibbs_J(liquidOxideMoles, temperature_C);
      if (associate) result = { excessGibbs_J: associate.excessGibbs_J, mode: 'associate' };
      else {
        const mao = MaoIonicSpeciation.excessGibbs_J(liquidOxideMoles, temperature_C);
        if (mao) result = { excessGibbs_J: mao.excessGibbs_J, mode: 'mao_ionic' };
        else if (AbdulLiquid.coversCas(liquidOxideMoles)) {
          result = {
            excessGibbs_J: AbdulLiquidExcess.excessGibbs_J(liquidOxideMoles, temperature_C),
            mode: 'abdul_rk',
          };
        }
      }
    }
    CasLiquidExcess.cache.set(key, result);
    return result;
  }

  private static cacheKey(moles: Record<string, number>, temperature_C: number): string {
    const total = Object.values(moles).reduce((sum, n) => sum + Math.max(n, 0), 0);
    if (total <= 0) return `${temperature_C}|empty`;
    // Coarse mole-fraction bins so neighbouring outer-simplex probes reuse one nested solve.
    const parts = Object.keys(moles)
      .sort()
      .map(k => `${k}:${(Math.max(moles[k], 0) / total).toFixed(2)}`);
    return `${Math.round(temperature_C)}|${parts.join(',')}`;
  }
}
