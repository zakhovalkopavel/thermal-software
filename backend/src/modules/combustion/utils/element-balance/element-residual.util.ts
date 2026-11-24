import { COMBUSTION, ELEMENTS } from '../../constants';
import { ElementFlows } from '../../types';

/** Largest relative element mismatch between two inventories */
export function elementResidual(a: ElementFlows, b: ElementFlows): number {
  const scale = Math.max(...ELEMENTS.map(e => Math.abs(a[e])), COMBUSTION.DIVISION_FLOOR);
  return Math.max(...ELEMENTS.map(e => Math.abs(a[e] - b[e]))) / scale;
}
