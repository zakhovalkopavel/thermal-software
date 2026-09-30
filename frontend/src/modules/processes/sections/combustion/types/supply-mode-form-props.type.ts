import type { NumberFieldSpec } from '../../../types/number-field-spec.type';
import type { CombustionFormProps } from './combustion-form-props.type';
import type { SupplyModeDraft } from './supply-mode-draft.type';

export type SupplyModeFormProps<K extends string> = CombustionFormProps<SupplyModeDraft<K>> & {
  fields: { main: ReadonlyArray<NumberFieldSpec<K>>; advanced: ReadonlyArray<NumberFieldSpec<K>> };
};
