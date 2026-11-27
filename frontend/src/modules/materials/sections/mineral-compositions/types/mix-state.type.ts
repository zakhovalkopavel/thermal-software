import type { MixFraction } from './mix-fraction.type';
import type { PackingModel } from './packing-model.type';

export type MixState = {
  fractions: MixFraction[];
  /** Packing fraction φ from the selected packing model (default CPM). */
  phi: number | null;
  /** Green porosity 0–1 from the same packing result; Chemical/Water may override locally. */
  porosity: number | null;
  /** Which packing model last wrote φ / porosity; `null` until the first CPM sync. */
  packingModel: PackingModel | null;
};
