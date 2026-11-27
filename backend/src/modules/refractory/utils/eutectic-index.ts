import * as fs from 'fs';
import * as path from 'path';
import { CHEMISTRY } from '../../../common/chemistry/constants/chemistry.constants';
import { molarMass } from '../../../common/chemistry/compounds/molar-mass.util';
import { EUTECTIC_INDEX_CONSTANTS } from '../constants/eutectic-index.constants';
import type { EutecticEntry } from '../types/eutectic-entry.type';

/**
 * Filesystem access and lookup over the NSRDS-NBS 61 eutectic table
 * (`shared/processed/eutectic-data`), restricted to oxide / fluoride systems
 * with a known eutectic composition and temperature.
 */
export class EutecticIndex {
  private static entriesCache: EutecticEntry[] | undefined;

  /** Dataset root: nearest ancestor of this module that contains the entries file. */
  static dir(): string {
    const { datasetPath, entriesFile } = EUTECTIC_INDEX_CONSTANTS;
    for (let dir = __dirname; ; dir = path.dirname(dir)) {
      const candidate = path.join(dir, 'shared', ...datasetPath);
      if (fs.existsSync(path.join(candidate, entriesFile))) return candidate;
      if (path.dirname(dir) === dir) {
        throw new Error(`eutectic-data directory not found above ${__dirname}`);
      }
    }
  }

  /** All usable entries: ≥ 2 components, all oxide/fluoride, composition and temperature present. */
  static loadEntries(): EutecticEntry[] {
    EutecticIndex.entriesCache ??= (
      JSON.parse(
        fs.readFileSync(path.join(EutecticIndex.dir(), EUTECTIC_INDEX_CONSTANTS.entriesFile), 'utf8'),
      ) as EutecticEntry[]
    ).filter(entry => EutecticIndex.isUsable(entry));
    return EutecticIndex.entriesCache;
  }

  /**
   * Best eutectic for the requested components (non-oxide / non-fluoride names are ignored).
   * Candidates are entries whose components are a subset of (or equal to) the request.
   * An exact component-set match wins; otherwise the subsystem covering the most weight
   * (`weights`, e.g. the wt% of each oxide; every component counts 1 when omitted, i.e. the
   * largest subsystem); among equals the lowest eutectic temperature.
   */
  static bestMatch(components: string[], weights?: Record<string, number>): EutecticEntry | undefined {
    const requested = new Set(components.filter(c => EutecticIndex.looksLikeOxideOrFluoride(c)));
    const candidates = EutecticIndex.loadEntries().filter(e => e.components.every(c => requested.has(c)));
    if (candidates.length === 0) return undefined;
    const exact = candidates.filter(e => EutecticIndex.isExactMatch(e, [...requested]));
    const pool = exact.length > 0 ? exact : EutecticIndex.bestCovered(candidates, weights);
    return pool.reduce((best, e) => (e.temperature_C < best.temperature_C ? e : best));
  }

  /** The entry has exactly the requested (oxide / fluoride) component set. */
  static isExactMatch(entry: EutecticEntry, components: string[]): boolean {
    const requested = new Set(components.filter(c => EutecticIndex.looksLikeOxideOrFluoride(c)));
    const own = new Set(entry.components);
    return own.size === requested.size && [...own].every(c => requested.has(c));
  }

  /** Eutectic composition converted from mol% to wt% (Σ = 100); empty when the entry has no composition. */
  static weightComposition(entry: EutecticEntry): Record<string, number> {
    if (!entry.composition_mol) return {};
    const masses = entry.components.map(
      (formula, i) => entry.composition_mol[i] * molarMass(formula) * CHEMISTRY.GRAMS_PER_KILOGRAM,
    );
    const total = masses.reduce((sum, m) => sum + m, 0);
    if (total <= 0) return {};
    return Object.fromEntries(entry.components.map((formula, i) => [formula, (100 * masses[i]) / total]));
  }

  static looksLikeOxideOrFluoride(formula: string): boolean {
    return EUTECTIC_INDEX_CONSTANTS.oxideFluoridePattern.test(formula);
  }

  static resetCache(): void {
    EutecticIndex.entriesCache = undefined;
  }

  private static isUsable(entry: EutecticEntry): boolean {
    return (
      Array.isArray(entry.components) &&
      entry.components.length >= EUTECTIC_INDEX_CONSTANTS.minComponents &&
      entry.components.every(c => EutecticIndex.looksLikeOxideOrFluoride(c)) &&
      Array.isArray(entry.composition_mol) &&
      entry.composition_mol.length === entry.components.length &&
      typeof entry.temperature_C === 'number'
    );
  }

  /** Entries whose components carry the largest total weight. */
  private static bestCovered(entries: EutecticEntry[], weights?: Record<string, number>): EutecticEntry[] {
    const coverage = (e: EutecticEntry): number =>
      e.components.reduce((sum, c) => sum + (weights ? (weights[c] ?? 0) : 1), 0);
    const best = Math.max(...entries.map(coverage));
    return entries.filter(e => coverage(e) === best);
  }
}
