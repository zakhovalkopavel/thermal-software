import { Species } from '../../../thermodynamics/enums';
import { GasFlows } from '../../types';
import { totalMoles } from './total-moles.util';

export function moleFractions(flows: GasFlows): GasFlows {
  const total = totalMoles(flows);
  const out: GasFlows = {};
  for (const [sp, n] of Object.entries(flows) as [Species, number][]) out[sp] = total > 0 ? n / total : 0;
  return out;
}
