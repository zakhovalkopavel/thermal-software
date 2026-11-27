import { nasa7Species, nasa9Species } from '../nasa';
import { CompoundDataIndexEntry } from './types/dataset/compound-data-index-entry.type';
import { CompoundDataPropertyValue } from './types/property/compound-data-property-value.type';

/** Liquid species keys end in `(L)` */
const LIQUID_KEY = /\(l\)$/i;
/** Phase label stored in the NASA databases for gas-phase species */
const NASA_GAS_PHASE = 'gas';

/**
 * Liquid-phase selection helpers for `CompoundValueBuilder.forLiquid`.
 * Stateless — no DI.
 */
export class CompoundLiquidData {
  /**
   * Scalar of a liquid-phase row: the first `phase === 'liquid'` row, else undefined.
   */
  static liquidPhase(rows: CompoundDataPropertyValue[] | undefined): number | undefined {
    return rows?.find((row) => row.phase === 'liquid')?.value;
  }

  /**
   * Liquid NASA keys of an index entry (`…(L)`). Gas-phase species are skipped.
   * When `preferred` is listed and present, it wins; otherwise the first liquid key.
   */
  static nasaKeys(
    meta: CompoundDataIndexEntry,
    preferred?: string,
  ): { nasa7Key?: string; nasa9Key?: string } {
    const nasa9Key = CompoundLiquidData.pickKey(meta.nasa9, preferred, CompoundLiquidData.isGas9);
    const nasa7Key = CompoundLiquidData.pickKey(meta.nasa7, preferred, CompoundLiquidData.isGas7);
    return {
      ...(nasa9Key ? { nasa9Key } : {}),
      ...(nasa7Key ? { nasa7Key } : {}),
    };
  }

  private static pickKey(
    keys: string[] | undefined,
    preferred: string | undefined,
    isGas: (key: string) => boolean,
  ): string | undefined {
    const liquids = (keys ?? []).filter((key) => LIQUID_KEY.test(key) && !isGas(key));
    if (preferred && liquids.includes(preferred)) return preferred;
    return liquids[0];
  }

  private static isGas9(key: string): boolean {
    return CompoundLiquidData.phaseIsGas(() => nasa9Species(key).phase);
  }

  private static isGas7(key: string): boolean {
    return CompoundLiquidData.phaseIsGas(() => nasa7Species(key).phase);
  }

  private static phaseIsGas(phase: () => string): boolean {
    try {
      return phase() === NASA_GAS_PHASE;
    } catch {
      return false;
    }
  }
}
