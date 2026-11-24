import type { CombustionModeInput } from '../../../types/combustion-mode-input.type';
import { assertRequiredNumbers } from '../../../mappers/required-numbers.mapper';
import { withoutNulls } from '@/shared/utils/without-nulls';
import { RECUPERATOR_FIELDS } from '../constants/recuperator-fields.constants';
import type { RecuperatorDraft } from '../types/recuperator-draft.type';
import type { RecuperatorInput } from '../types/recuperator-input.type';

const REQUIRED = [...RECUPERATOR_FIELDS.air, ...RECUPERATOR_FIELDS.geometry, ...RECUPERATOR_FIELDS.materials];

/** Throws a user-facing message when a required field is missing; h₀ and passes are sent for circle-in-ring only. */
export function toRecuperatorInput(draft: RecuperatorDraft, combustion: CombustionModeInput): RecuperatorInput {
  assertRequiredNumbers(REQUIRED, draft.values);
  const { h0_m, nPasses, ...values } = draft.values;
  const ring = draft.holeForm === 'circle_in_ring' ? withoutNulls({ h0_m, nPasses }) : {};
  return {
    ...(withoutNulls(values) as Omit<RecuperatorInput, 'combustion' | 'holeForm'>),
    ...ring,
    combustion,
    holeForm: draft.holeForm,
    smokeTurbulence: draft.smokeTurbulence,
  };
}
