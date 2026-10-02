import { Species } from '../../../thermodynamics/enums';
import { GasFlows } from '../../types';
import { speciesMolarMass } from './species-molar-mass.util';

/**
 * Air stream carrying `o2_mols` of O2 [mol/s].
 * pO2 — O2 vol fraction in dry air (rest N2); wH2Om — water mass per mass of dry air.
 */
export function airFlows(o2_mols: number, pO2: number, wH2Om: number): GasFlows {
  const n2_mols = o2_mols * (1 - pO2) / pO2;
  const mDry_kgs = o2_mols * speciesMolarMass(Species.O2) + n2_mols * speciesMolarMass(Species.N2);
  const flows: GasFlows = { [Species.O2]: o2_mols, [Species.N2]: n2_mols };
  if (wH2Om > 0) flows[Species.H2O] = wH2Om * mDry_kgs / speciesMolarMass(Species.H2O);
  return flows;
}
