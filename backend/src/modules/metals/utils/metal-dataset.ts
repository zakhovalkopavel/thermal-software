import * as fs from 'fs';
import * as path from 'path';
import { MetalAlloyRecord } from '../types/metal-alloy-record.type';
import { MetalDatasetIndex } from '../types/metal-dataset-index.type';

/**
 * Filesystem access for `shared/processed/metal-data`.
 */
export class MetalDataset {
  private static indexCache: MetalDatasetIndex | undefined;
  private static fileCache = new Map<string, MetalAlloyRecord>();

  /**
   * Dataset root: nearest ancestor of this module that contains
   * `shared/processed/metal-data/index.json`.
   */
  static dir(): string {
    for (let dir = __dirname; ; dir = path.dirname(dir)) {
      const candidate = path.join(dir, 'shared', 'processed', 'metal-data');
      if (fs.existsSync(path.join(candidate, 'index.json'))) return candidate;
      if (path.dirname(dir) === dir) {
        throw new Error(`metal-data directory not found above ${__dirname}`);
      }
    }
  }

  static loadIndex(): MetalDatasetIndex {
    MetalDataset.indexCache ??= JSON.parse(
      fs.readFileSync(path.join(MetalDataset.dir(), 'index.json'), 'utf8'),
    ) as MetalDatasetIndex;
    return MetalDataset.indexCache;
  }

  static loadAlloy(materialId: string): MetalAlloyRecord | undefined {
    const meta = MetalDataset.loadIndex().materials[materialId];
    if (!meta) return undefined;
    const cached = MetalDataset.fileCache.get(meta.path);
    if (cached) return cached;
    const doc = JSON.parse(
      fs.readFileSync(path.join(MetalDataset.dir(), meta.path), 'utf8'),
    ) as MetalAlloyRecord;
    MetalDataset.fileCache.set(meta.path, doc);
    return doc;
  }

  static resetCache(): void {
    MetalDataset.indexCache = undefined;
    MetalDataset.fileCache.clear();
  }
}
