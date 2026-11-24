import { molarMassGramsPerMol } from './molar-mass-grams-per-mol.util';

/** Formula → molar mass [g/mol] map; the key set doubles as a model's supported-component list */
export function molarMassTableGramsPerMol(formulas: readonly string[]): Record<string, number> {
  return Object.fromEntries(formulas.map((formula) => [formula, molarMassGramsPerMol(formula)]));
}
