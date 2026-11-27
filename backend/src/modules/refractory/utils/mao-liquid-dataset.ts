import * as fs from 'fs';
import * as path from 'path';
import type { MaoOxideGEntry } from '../types/mao-oxide-g-entry.type';

type MaoPhasesFile = {
  phases: {
    liquid_ionic_CAS: {
      oxideG: Record<string, MaoOxideGEntry>;
      endmembers: unknown[];
      interactions: unknown[];
      status?: string;
    };
  };
};

/**
 * Filesystem access for Mao 2006 ionic CAS liquid staging
 * (`shared/processed/minerals-thermodynamic/mao-2006/phases.json`).
 */
export class MaoLiquidDataset {
  private static cache: MaoPhasesFile | undefined;

  static path(): string {
    for (let dir = __dirname; ; dir = path.dirname(dir)) {
      const candidate = path.join(
        dir,
        'shared',
        'processed',
        'minerals-thermodynamic',
        'mao-2006',
        'phases.json',
      );
      if (fs.existsSync(candidate)) return candidate;
      if (path.dirname(dir) === dir) {
        throw new Error(`Mao phases.json not found above ${__dirname}`);
      }
    }
  }

  static load(): MaoPhasesFile {
    MaoLiquidDataset.cache ??= JSON.parse(fs.readFileSync(MaoLiquidDataset.path(), 'utf8')) as MaoPhasesFile;
    const liquid = MaoLiquidDataset.cache.phases?.liquid_ionic_CAS;
    if (!liquid?.oxideG || Object.keys(liquid.oxideG).length === 0) {
      throw new Error('Mao phases.json has no liquid_ionic_CAS.oxideG map');
    }
    return MaoLiquidDataset.cache;
  }

  static resetCache(): void {
    MaoLiquidDataset.cache = undefined;
  }
}
