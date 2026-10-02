import { calculateMolarMass } from '../formula/calculate-molar-mass.util';
import { ChemicalCompound } from './chemical-compound.interface';
import { COMPOUND_LIBRARY } from './compound-library.data';

/** Molar mass [kg/mol]: the COMPOUND_LIBRARY value, else calculated from the formula */
export function molarMass(formula: string): number {
  const compound: ChemicalCompound | undefined = (COMPOUND_LIBRARY as Record<string, ChemicalCompound>)[formula];
  return compound?.molarMass_kg_mol ?? calculateMolarMass(formula);
}
