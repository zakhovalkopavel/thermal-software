import type { CondensedFuelDraft } from './condensed-fuel-draft.type';
import type { SupplyDraft } from './supply-draft.type';

/** Solid modes 1 and 2: condensed fuel, supply and a set of numeric fields. */
export type SupplyModeDraft<K extends string> = {
  fuel: CondensedFuelDraft;
  supply: SupplyDraft;
  values: Record<K, number | null>;
};
