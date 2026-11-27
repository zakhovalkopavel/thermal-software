import * as fs from 'fs';
import * as path from 'path';
import type { AbdulFunctionEntry } from '../types/abdul-function-entry.type';
import type { AbdulLiquidParameter } from '../types/abdul-liquid-parameter.type';

type AbdulPhasesFile = {
  liquid: {
    endmemberG: AbdulLiquidParameter[];
    excessL: AbdulLiquidParameter[];
  };
  functions: Record<string, AbdulFunctionEntry>;
};

/**
 * Filesystem access for Abdul 2023 associate-liquid staging data
 * (`shared/processed/minerals-thermodynamic/abdul-2023/phases.json`).
 */
export class AbdulLiquidDataset {
  private static cache: AbdulPhasesFile | undefined;

  /** Dataset file: nearest ancestor that contains the processed minerals-thermodynamic tree. */
  static path(): string {
    for (let dir = __dirname; ; dir = path.dirname(dir)) {
      const candidate = path.join(
        dir,
        'shared',
        'processed',
        'minerals-thermodynamic',
        'abdul-2023',
        'phases.json',
      );
      if (fs.existsSync(candidate)) return candidate;
      if (path.dirname(dir) === dir) {
        throw new Error(`Abdul phases.json not found above ${__dirname}`);
      }
    }
  }

  static load(): AbdulPhasesFile {
    AbdulLiquidDataset.cache ??= JSON.parse(
      fs.readFileSync(AbdulLiquidDataset.path(), 'utf8'),
    ) as AbdulPhasesFile;
    if (!AbdulLiquidDataset.cache.functions || Object.keys(AbdulLiquidDataset.cache.functions).length === 0) {
      throw new Error('Abdul phases.json has no calculable `functions` map');
    }
    return AbdulLiquidDataset.cache;
  }

  static resetCache(): void {
    AbdulLiquidDataset.cache = undefined;
  }
}
