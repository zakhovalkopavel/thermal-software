import type { ThermalDraft } from './thermal-draft.type';

export type ThermalInputsFormProps = {
  draft: ThermalDraft;
  onChange: (draft: ThermalDraft) => void;
  onSubmit: () => void;
  loading: boolean;
  error: string | null;
};
