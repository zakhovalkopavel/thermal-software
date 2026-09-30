import type { CondensedFuelSupply } from '../../../types/condensed-fuel-supply.type';
import type { SupplyDraft } from '../types/supply-draft.type';

export function toSupply(draft: SupplyDraft): Pick<CondensedFuelSupply, 'fPower_W' | 'mFuel_kgs'> {
  if (draft.value === null) throw new Error(draft.basis === 'power' ? 'Enter the fuel power.' : 'Enter the fuel mass flow.');
  return draft.basis === 'power' ? { fPower_W: draft.value } : { mFuel_kgs: draft.value };
}
