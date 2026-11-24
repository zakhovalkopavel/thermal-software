import { Species } from '../../../thermodynamics/enums';
import { GasFlows } from '../../types';
import { speciesMolarMass } from './species-molar-mass.util';

export function gasMassFlow(flows: GasFlows): number {
  return (Object.entries(flows) as [Species, number][])
    .reduce((s, [sp, n]) => s + (n ?? 0) * speciesMolarMass(sp), 0);
}
