import * as fs from 'fs';
import * as path from 'path';
import { EquationTypeDto } from '../../dto/equation-type.dto';
import { RefKey } from '../../enum/ref-key.enum';
import { EquationValue } from '../../interfaces/equation-value.interface';
import { CompoundDataIndexFile } from './interfaces/dataset/compound-data-index-file.interface';
import { CompoundDataEquationValue } from './interfaces/equation/compound-data-equation-value.interface';
import { CompoundDataRef } from './interfaces/property/compound-data-ref.type';
import { CompoundDataCompoundFile } from './interfaces/record/compound-data-compound-file.interface';

const REF_KEYS = new Set<string>(Object.values(RefKey));
const EQUATION_TYPES = new Set<string>(Object.values(EquationTypeDto));

/**
 * Filesystem access and row mapping for `shared/processed/compound-data`.
 */
export class CompoundData {
  private static indexCache: CompoundDataIndexFile | undefined;
  private static fileCache = new Map<string, CompoundDataCompoundFile>();

  /**
   * Dataset root: nearest ancestor of this module that contains
   * `shared/processed/compound-data/index.json`.
   */
  static dir(): string {
    for (let dir = __dirname; ; dir = path.dirname(dir)) {
      const candidate = path.join(dir, 'shared', 'processed', 'compound-data');
      if (fs.existsSync(path.join(candidate, 'index.json'))) return candidate;
      if (path.dirname(dir) === dir) {
        throw new Error(`compound-data directory not found above ${__dirname}`);
      }
    }
  }

  /** `index.json`, parsed once. */
  static loadIndex(): CompoundDataIndexFile {
    CompoundData.indexCache ??= JSON.parse(
      fs.readFileSync(path.join(CompoundData.dir(), 'index.json'), 'utf8'),
    ) as CompoundDataIndexFile;
    return CompoundData.indexCache;
  }

  /** One compound file, path relative to the dataset folder, parsed once. */
  static loadFile(relativePath: string): CompoundDataCompoundFile {
    const cached = CompoundData.fileCache.get(relativePath);
    if (cached) return cached;
    const doc = JSON.parse(
      fs.readFileSync(path.join(CompoundData.dir(), relativePath), 'utf8'),
    ) as CompoundDataCompoundFile;
    CompoundData.fileCache.set(relativePath, doc);
    return doc;
  }

  /**
   * Dataset row → backend `EquationValue`.
   * `ref` is the source-row tuple; the backend keeps `ref[0]`.
   * A missing temperature range (`null`, e.g. VDI gas tables) stays `null`
   * (unknown — not conflated with “valid everywhere”).
   */
  static toEquationValue(row: CompoundDataEquationValue): EquationValue {
    if (!EQUATION_TYPES.has(row.type)) {
      throw new Error(`Compound-data equation type "${row.type}" is not implemented`);
    }
    const value: EquationValue = {
      type: row.type as EquationTypeDto,
      ref: CompoundData.refKey(row.ref),
      vars: row.vars,
      min: row.min,
      max: row.max,
    };
    if (row.k !== undefined) value.k = row.k;
    return value;
  }

  /** Test helper: clear parsed index/file caches. */
  static resetCache(): void {
    CompoundData.indexCache = undefined;
    CompoundData.fileCache.clear();
  }

  private static refKey(ref: CompoundDataRef | string): RefKey {
    const key = Array.isArray(ref) ? ref[0] : ref;
    if (!REF_KEYS.has(key)) throw new Error(`Compound-data ref "${key}" is not a RefKey`);
    return key as RefKey;
  }
}
