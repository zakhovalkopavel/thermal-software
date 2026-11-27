import { nasa7Species, nasa9Species } from '../nasa';
import { CompoundDataIndexEntry } from './types/dataset/compound-data-index-entry.type';
import { CompoundDataPropertyValue } from './types/property/compound-data-property-value.type';

/** Condensed-phase suffixes preferred when several NASA species share a formula: `(a)`, `(s)`, `(cr)`. */
const PREFERRED_SOLID_KEY = /\((a|s|cr)\)/i;
/** Liquid species keys end in `(L)` */
const LIQUID_KEY = /\(l\)$/i;
/** Phase label stored in the NASA databases for gas-phase species */
const NASA_GAS_PHASE = 'gas';

/**
 * Solid-phase selection helpers for `CompoundValueBuilder.forSolid`.
 * Stateless — no DI.
 */
export class CompoundSolidData {
  /**
   * Scalar of a solid-phase row: the first `phase === 'solid'` row, else the only row
   * when there is exactly one; undefined otherwise.
   */
  static solidPhase(rows: CompoundDataPropertyValue[] | undefined): number | undefined {
    const solid = rows?.find((row) => row.phase === 'solid');
    if (solid) return solid.value;
    return rows?.length === 1 ? rows[0].value : undefined;
  }

  /**
   * Condensed solid NASA keys of an index entry. Liquid (`…(L)`) and gas-phase species are skipped;
   * keys containing `(a)` / `(s)` / `(cr)` win, then any other non-liquid, non-gas key.
   * Keys are omitted when the entry only lists liquid / gas species.
   */
  static nasaKeys(meta: CompoundDataIndexEntry): { nasa7Key?: string; nasa9Key?: string } {
    const nasa9Key = CompoundSolidData.pickKey(meta.nasa9, CompoundSolidData.isGas9);
    const nasa7Key = CompoundSolidData.pickKey(meta.nasa7, CompoundSolidData.isGas7);
    return {
      ...(nasa9Key ? { nasa9Key } : {}),
      ...(nasa7Key ? { nasa7Key } : {}),
    };
  }

  private static pickKey(
    keys: string[] | undefined,
    isGas: (key: string) => boolean,
  ): string | undefined {
    const candidates = (keys ?? []).filter((key) => !LIQUID_KEY.test(key) && !isGas(key));
    return candidates.find((key) => PREFERRED_SOLID_KEY.test(key)) ?? candidates[0];
  }

  private static isGas9(key: string): boolean {
    return CompoundSolidData.phaseIsGas(() => nasa9Species(key).phase);
  }

  private static isGas7(key: string): boolean {
    return CompoundSolidData.phaseIsGas(() => nasa7Species(key).phase);
  }

  /** Unknown species (lookup throws) are not treated as gas. */
  private static phaseIsGas(phase: () => string): boolean {
    try {
      return phase() === NASA_GAS_PHASE;
    } catch {
      return false;
    }
  }
}
