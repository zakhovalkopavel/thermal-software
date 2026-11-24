import { loadNasaDatabase } from './load-nasa-database.util';
import { NASA_DATABASE } from './constants/nasa-database.constants';
import { NasaDatabase } from './types/nasa-database.type';
import { Nasa7Species } from './types/nasa7-species.type';

let nasa7Db: NasaDatabase<Nasa7Species> | undefined;

/** NASA-7 species record by its exact nasa7.json key */
export function nasa7Species(key: string): Nasa7Species {
  nasa7Db ??= loadNasaDatabase<Nasa7Species>(NASA_DATABASE.NASA7_FILE);
  const species = nasa7Db.species[key];
  if (!species) throw new Error(`NASA-7 species "${key}" not found in ${NASA_DATABASE.NASA7_FILE}`);
  return species;
}
