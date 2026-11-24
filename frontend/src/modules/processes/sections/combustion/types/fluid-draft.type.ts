import type { CondensedFuelDraft } from './condensed-fuel-draft.type';
import type { FluidFieldKey } from './fluid-field-key.type';
import type { SupplyDraft } from './supply-draft.type';

export type FluidDraft = {
  phase: 'gas' | 'liquid';
  gasSource: 'preset' | 'custom';
  /** null = first gas preset. */
  gasFuelId: string | null;
  fuelGas: Record<string, number>;
  liquidFuel: CondensedFuelDraft;
  supply: SupplyDraft;
  values: Record<FluidFieldKey, number | null>;
};
