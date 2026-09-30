import { assertRequiredNumbers } from '../../../mappers/required-numbers.mapper';
import { withoutNulls } from '../../../mappers/without-nulls.mapper';
import type { FuelSummary } from '../../../types/fuel-summary.type';
import type { SolidDirectInput } from '../../../types/solid-direct-input.type';
import { COMBUSTION_FIELDS } from '../constants/combustion-fields.constants';
import type { SolidDirectDraft } from '../types/solid-direct-draft.type';
import { toFuelSelection } from './fuel-selection-request.mapper';
import { toSupply } from './supply-request.mapper';

export function toSolidDirectInput(draft: SolidDirectDraft, solidPresets: FuelSummary[]): SolidDirectInput {
  assertRequiredNumbers(COMBUSTION_FIELDS.solidDirect.main, draft.values);
  const { kExcessAir, tAir_K, ...optional } = draft.values;
  return {
    ...toFuelSelection(draft.fuel, solidPresets, false),
    ...toSupply(draft.supply),
    kExcessAir: kExcessAir as number,
    tAir_K: tAir_K as number,
    ...withoutNulls(optional),
  };
}
