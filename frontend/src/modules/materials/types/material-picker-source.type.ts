import type { GasListEntry } from './gas-list-entry.type';
import type { MaterialCategory } from './material-category.type';
import type { MetalSummary } from './metal-summary.type';
import type { RefractoryProductSummary } from './refractory-product-summary.type';

export type MaterialPickerSource =
  | { kind: 'metal'; data: MetalSummary[] }
  | { kind: 'refractory'; data: RefractoryProductSummary[] }
  | { kind: 'gas'; data: GasListEntry[] }
  | { kind: 'library' | 'mix-component'; data: MaterialCategory[] };
