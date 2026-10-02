import * as fs from 'fs';
import * as path from 'path';
import { NASA_DATABASE } from './nasa-database.constants';
import { NasaDatabase } from './nasa-database.interface';

/** `data/nasa` of the backend root: the nearest ancestor of this file (src/ or dist/) that has it */
function nasaDataDir(): string {
  for (let dir = __dirname; ; dir = path.dirname(dir)) {
    const candidate = path.join(dir, NASA_DATABASE.DATA_DIR);
    if (fs.existsSync(candidate)) return candidate;
    if (path.dirname(dir) === dir) {
      throw new Error(`NASA data directory "${NASA_DATABASE.DATA_DIR}" not found above ${__dirname}`);
    }
  }
}

/** Parse a NASA database JSON file of `data/nasa` */
export function loadNasaDatabase<T>(file: string): NasaDatabase<T> {
  return JSON.parse(fs.readFileSync(path.join(nasaDataDir(), file), 'utf8')) as NasaDatabase<T>;
}
