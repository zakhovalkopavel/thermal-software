import { atomicMass } from '../elements/atomic-mass.util';
import { parseFormula } from './parse-formula.util';

/** Molar mass of a chemical formula from the standard atomic weights [kg/mol] */
export function calculateMolarMass(formula: string): number {
  return Object.entries(parseFormula(formula)).reduce((M, [el, n]) => M + n * atomicMass(el), 0);
}
