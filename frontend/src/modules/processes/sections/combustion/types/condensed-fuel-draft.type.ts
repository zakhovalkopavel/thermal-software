import type { CustomFuelPropertyKey } from './custom-fuel-property-key.type';
import type { ElementKey } from './element-key.type';

export type CondensedFuelDraft = {
  source: 'preset' | 'custom';
  /** null = first preset of the phase. */
  fuelId: string | null;
  name: string;
  elemental: Record<ElementKey, number | null>;
  energyBasis: 'lhv' | 'heatOfFormation';
  properties: Record<CustomFuelPropertyKey, number | null>;
};
