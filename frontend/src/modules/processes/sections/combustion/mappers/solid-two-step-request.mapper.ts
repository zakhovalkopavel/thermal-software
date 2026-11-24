import { assertRequiredNumbers } from '../../../mappers/required-numbers.mapper';
import { withoutNulls } from '@/shared/utils/without-nulls';
import type { FuelSummary } from '../../../types/fuel-summary.type';
import type { SolidTwoStepInput } from '../../../types/solid-two-step-input.type';
import { COMBUSTION_FIELDS } from '../constants/combustion-fields.constants';
import type { SolidTwoStepDraft } from '../types/solid-two-step-draft.type';
import { toFuelSelection } from './fuel-selection-request.mapper';
import { toSupply } from './supply-request.mapper';

export function toSolidTwoStepInput(draft: SolidTwoStepDraft, solidPresets: FuelSummary[]): SolidTwoStepInput {
  assertRequiredNumbers(COMBUSTION_FIELDS.solidTwoStep.main, draft.values);
  const { kExcessAir, tAirPrimary_K, ...optional } = draft.values;
  return {
    ...toFuelSelection(draft.fuel, solidPresets, false),
    ...toSupply(draft.supply),
    kExcessAir: kExcessAir as number,
    tAirPrimary_K: tAirPrimary_K as number,
    ...withoutNulls(optional),
  };
}
