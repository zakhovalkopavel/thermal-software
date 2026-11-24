import type { HoleForm } from './hole-form.type';
import type { RecuperatorFieldKey } from './recuperator-field-key.type';

export type RecuperatorDraft = {
  holeForm: HoleForm;
  smokeTurbulence: boolean;
  values: Record<RecuperatorFieldKey, number | null>;
};
