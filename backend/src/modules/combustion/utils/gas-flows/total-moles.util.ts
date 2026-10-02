import { GasFlows } from '../../types';

export function totalMoles(flows: GasFlows): number {
  return Object.values(flows).reduce((s: number, n) => s + (n ?? 0), 0);
}
