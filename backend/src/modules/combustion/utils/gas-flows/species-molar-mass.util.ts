import { Species } from '../../../thermodynamics/enums';
import { GAS_REGISTRY } from '../../../../common/thermal/compound/gas';
import { calculateMolarMass, parseFormula } from '../../../../common/chemistry';
import { ATOMIC_MASS } from '../../constants';

const molarMassCache = new Map<Species, number>();

/**
 * Molar mass [kg/mol] from the formula and ATOMIC_MASS, so that species masses are consistent
 * with element masses (exact mass closure); registry Mr for species with other elements (Ar).
 */
export function speciesMolarMass(species: Species): number {
  let M = molarMassCache.get(species);
  if (M === undefined) {
    const compound = GAS_REGISTRY[species];
    if (!compound) throw new Error(`Unknown species: ${species}`);
    const atoms = Object.keys(parseFormula(compound.chemicalFormula));
    M = atoms.every((a) => a in ATOMIC_MASS)
      ? calculateMolarMass(compound.chemicalFormula)
      : compound.Mr;
    molarMassCache.set(species, M);
  }
  return M;
}
