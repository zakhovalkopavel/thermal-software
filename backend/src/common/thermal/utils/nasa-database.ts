import * as fs from 'fs';
import * as path from 'path';
import { CompoundValue } from '../interfaces/compound-value.interface';
import { Nasa7Equation } from '../type/nasa7-equation';
import { Nasa9Equation } from '../type/nasa9-equation';

/**
 * NASA thermodynamic databases in `backend/data/nasa/`, produced by the NASA thermo parser
 * (`make nasa-parse`, see docs/scripts/NASA_THERMO_PARSER_SPEC.md):
 *   nasa7.json — ref NASA7 (NASA SP-273 / TM-2002-211556 via CaltechSDT, 7 coefficients)
 *   nasa9.json — ref NASA9 (NASA RP-1311 + Burcat & Ruscic ANL-05/20, 9 coefficients)
 * Compounds reference a species by its exact key (`nasa7Key` / `nasa9Key`).
 */
const NASA_DATA_DIR = path.join('data', 'nasa');

export interface Nasa7Species {
  name: string;
  comment: string;
  phase: string;
  /** Molar mass [g/mol] */
  MW: number | null;
  /** Validity range [K] */
  Tmin: number;
  Tmax: number;
  nasa7: Nasa7Equation;
}

export interface Nasa9Species {
  name: string;
  comment: string;
  refCode: string;
  phase: string;
  /** Molar mass [g/mol] */
  MW: number | null;
  /** Enthalpy of formation at 298.15 K [J/mol] */
  Hf298: number | null;
  nasa9: Nasa9Equation;
}

interface NasaDatabase<T> {
  source: string;
  ref: string;
  count: number;
  species: Record<string, T>;
}

let nasa7Db: NasaDatabase<Nasa7Species> | undefined;
let nasa9Db: NasaDatabase<Nasa9Species> | undefined;

/** `data/nasa` of the backend root: the nearest ancestor of this file (src/ or dist/) that has it */
function nasaDataDir(): string {
  for (let dir = __dirname; ; dir = path.dirname(dir)) {
    const candidate = path.join(dir, NASA_DATA_DIR);
    if (fs.existsSync(candidate)) return candidate;
    if (path.dirname(dir) === dir) throw new Error(`NASA data directory "${NASA_DATA_DIR}" not found above ${__dirname}`);
  }
}

function load<T>(file: string): NasaDatabase<T> {
  return JSON.parse(fs.readFileSync(path.join(nasaDataDir(), file), 'utf8')) as NasaDatabase<T>;
}

/** NASA-7 species record by its exact nasa7.json key */
export function nasa7Species(key: string): Nasa7Species {
  nasa7Db ??= load<Nasa7Species>('nasa7.json');
  const species = nasa7Db.species[key];
  if (!species) throw new Error(`NASA-7 species "${key}" not found in nasa7.json`);
  return species;
}

/** NASA-9 species record by its exact nasa9.json key */
export function nasa9Species(key: string): Nasa9Species {
  nasa9Db ??= load<Nasa9Species>('nasa9.json');
  const species = nasa9Db.species[key];
  if (!species) throw new Error(`NASA-9 species "${key}" not found in nasa9.json`);
  return species;
}

/** NASA-7 record of a compound, or undefined when it has no `nasa7Key` */
export function compoundNasa7(compound: CompoundValue): Nasa7Species | undefined {
  return compound.nasa7Key ? nasa7Species(compound.nasa7Key) : undefined;
}

/** NASA-9 record of a compound, or undefined when it has no `nasa9Key` */
export function compoundNasa9(compound: CompoundValue): Nasa9Species | undefined {
  return compound.nasa9Key ? nasa9Species(compound.nasa9Key) : undefined;
}
