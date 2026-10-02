import { ELEMENTS } from '../../constants';
import { ElementFlows } from '../../types';
import { emptyElements } from './empty-elements.util';

export function addElements(a: ElementFlows, b: ElementFlows): ElementFlows {
  const out = emptyElements();
  for (const e of ELEMENTS) out[e] = a[e] + b[e];
  return out;
}
