import { COMBUSTION_UI } from '../constants/combustion-ui.constants';
import type { CombustionSummary } from '../types/combustion-summary.type';
import type { ProductRow } from '../types/product-row.type';

/** Always-returned species first, then any inert species fed with the fuel. */
export function toProductRows(steps: CombustionSummary['steps']): ProductRow[] {
  const known: readonly string[] = COMBUSTION_UI.productSpecies;
  const extra = [...new Set(steps.flatMap((step) => Object.keys(step.result.products.moleFractions)))].filter((species) => !known.includes(species));
  return [...known, ...extra].map((species) => ({
    species,
    values: Object.fromEntries(
      steps.map((step) => [
        step.key,
        { moleFraction: step.result.products.moleFractions[species] ?? 0, massFlow_kgs: step.result.products.massFlows_kgs[species] ?? 0 },
      ]),
    ),
  }));
}
