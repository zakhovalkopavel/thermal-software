import { loadNasaDatabase } from './load-nasa-database.util';
import { NASA_DATABASE } from './nasa-database.constants';
import { NasaDatabase } from './nasa-database.interface';
import { Nasa9Species } from './nasa9-species.interface';

let nasa9Db: NasaDatabase<Nasa9Species> | undefined;

/** NASA-9 species record by its exact nasa9.json key */
export function nasa9Species(key: string): Nasa9Species {
  nasa9Db ??= loadNasaDatabase<Nasa9Species>(NASA_DATABASE.NASA9_FILE);
  const species = nasa9Db.species[key];
  if (!species) throw new Error(`NASA-9 species "${key}" not found in ${NASA_DATABASE.NASA9_FILE}`);
  return species;
}
