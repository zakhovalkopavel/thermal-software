import { SpeciesValues, GasFlows } from '../../types';
import { PRODUCT_SPECIES } from '../../constants';

/** Fixed-key species map: product species always present, extra species appended */
export function toSpeciesValues(flows: GasFlows): SpeciesValues {
  const out: SpeciesValues = {};
  for (const sp of PRODUCT_SPECIES) out[sp] = flows[sp] ?? 0;
  for (const [sp, v] of Object.entries(flows)) if (!(sp in out)) out[sp] = v ?? 0;
  return out;
}
