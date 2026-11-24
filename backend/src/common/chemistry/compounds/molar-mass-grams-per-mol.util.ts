import { CHEMISTRY } from '../constants/chemistry.constants';
import { molarMass } from './molar-mass.util';

/** Molar mass [g/mol] for models that work in grams */
export function molarMassGramsPerMol(formula: string): number {
  return molarMass(formula) * CHEMISTRY.GRAMS_PER_KILOGRAM;
}
