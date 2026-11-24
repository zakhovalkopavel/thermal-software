import { Species } from '../../../thermodynamics/enums';
import { GasFlows } from '../../types';

export function sumFlows(...all: GasFlows[]): GasFlows {
  const out: GasFlows = {};
  for (const flows of all) {
    for (const [sp, n] of Object.entries(flows) as [Species, number][]) {
      if (n) out[sp] = (out[sp] ?? 0) + n;
    }
  }
  return out;
}
