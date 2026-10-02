import { Species } from '../../../thermodynamics/enums';
import { speciesMolarMass } from '../gas-flows';

/** Dry air [kg] carrying `o2_mols` of O2 */
export function dryAirMass(o2_mols: number, pO2: number): number {
  return o2_mols * (speciesMolarMass(Species.O2) + (1 - pO2) / pO2 * speciesMolarMass(Species.N2));
}
