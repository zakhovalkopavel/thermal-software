import * as fs from 'fs';
import * as path from 'path';
import { NasaDatabase } from './nasa-database.interface';

/**
 * `shared/processed/NASA` of the repo root: the nearest ancestor of this file
 * (`src/` or `dist/`) that contains `nasa7.json`.
 */
function nasaDataDir(): string {
  for (let dir = __dirname; ; dir = path.dirname(dir)) {
    const candidate = path.join(dir, 'shared', 'processed', 'NASA');
    if (fs.existsSync(path.join(candidate, 'nasa7.json'))) return candidate;
    if (path.dirname(dir) === dir) {
      throw new Error(`NASA directory not found above ${__dirname}`);
    }
  }
}

/** Parse a NASA database JSON file from `shared/processed/NASA` */
export function loadNasaDatabase<T>(file: string): NasaDatabase<T> {
  return JSON.parse(fs.readFileSync(path.join(nasaDataDir(), file), 'utf8')) as NasaDatabase<T>;
}
