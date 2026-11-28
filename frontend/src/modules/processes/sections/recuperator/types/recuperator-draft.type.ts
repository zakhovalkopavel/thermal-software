import type { MaterialPickerSelection } from '../../../../materials';
import type { HoleForm } from './hole-form.type';
import type { RecuperatorFieldKey } from './recuperator-field-key.type';

export type RecuperatorDraft = {
  holeForm: HoleForm;
  smokeTurbulence: boolean;
  /** When set, the backend evaluates wall λ(T) / ε(T) from this material. */
  wallMaterial: MaterialPickerSelection | null;
  values: Record<RecuperatorFieldKey, number | null>;
};
