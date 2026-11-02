import * as fs from 'fs';
import * as path from 'path';

/**
 * `shared/processed/compound-data` of the repo root: the nearest ancestor of this
 * file (`src/` or `dist/`) that contains `index.json`.
 */
export function compoundDataDir(): string {
  for (let dir = __dirname; ; dir = path.dirname(dir)) {
    const candidate = path.join(dir, 'shared', 'processed', 'compound-data');
    if (fs.existsSync(path.join(candidate, 'index.json'))) return candidate;
    if (path.dirname(dir) === dir) {
      throw new Error(`compound-data directory not found above ${__dirname}`);
    }
  }
}
