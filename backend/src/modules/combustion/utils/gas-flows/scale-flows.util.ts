import { Species } from '../../../thermodynamics/enums';
import { GasFlows } from '../../types';

export function scaleFlows(flows: GasFlows, k: number): GasFlows {
  const out: GasFlows = {};
  for (const [sp, n] of Object.entries(flows) as [Species, number][]) out[sp] = n * k;
  return out;
}
