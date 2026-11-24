import { Species } from '../../../thermodynamics/enums';
import { GAS_REGISTRY } from '../../../../common/thermal/compound/gas';
import { parseFormula } from '../../../../common/chemistry';
import { ELEMENTS } from '../../constants';
import { Element, ElementFlows, GasFlows } from '../../types';
import { emptyElements } from './empty-elements.util';

/** Species carrying none of C, H, O, N, S (e.g. Ar) pass through combustion unchanged */
function isInert(species: Species): boolean {
  const atoms = parseFormula(GAS_REGISTRY[species].chemicalFormula);
  return !Object.keys(atoms).some(a => (ELEMENTS as readonly string[]).includes(a));
}

/** Split gas flows into reacting-element flows and inert species flows */
export function elementsOfGas(flows: GasFlows): { elements: ElementFlows; inerts: GasFlows } {
  const elements = emptyElements();
  const inerts: GasFlows = {};
  for (const [sp, n] of Object.entries(flows) as [Species, number][]) {
    if (!n) continue;
    const compound = GAS_REGISTRY[sp];
    if (!compound) throw new Error(`Unknown species: ${sp}`);
    const atoms = parseFormula(compound.chemicalFormula);
    if (isInert(sp)) {
      inerts[sp] = (inerts[sp] ?? 0) + n;
      continue;
    }
    for (const [a, k] of Object.entries(atoms)) {
      if (!(ELEMENTS as readonly string[]).includes(a)) {
        throw new Error(`Species ${sp} contains unsupported element ${a}`);
      }
      elements[a as Element] += k * n;
    }
  }
  return { elements, inerts };
}
