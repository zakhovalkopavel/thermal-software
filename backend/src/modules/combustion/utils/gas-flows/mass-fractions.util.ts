import { Species } from '../../../thermodynamics/enums';
import { GasFlows } from '../../types';
import { gasMassFlow } from './gas-mass-flow.util';
import { speciesMolarMass } from './species-molar-mass.util';

export function massFractions(flows: GasFlows): GasFlows {
  const total = gasMassFlow(flows);
  const out: GasFlows = {};
  for (const [sp, n] of Object.entries(flows) as [Species, number][]) {
    out[sp] = total > 0 ? n * speciesMolarMass(sp) / total : 0;
  }
  return out;
}
