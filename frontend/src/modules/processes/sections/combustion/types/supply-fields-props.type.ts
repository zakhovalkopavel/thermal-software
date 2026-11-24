import type { SupplyDraft } from './supply-draft.type';

export type SupplyFieldsProps = {
  value: SupplyDraft;
  onChange: (next: SupplyDraft) => void;
};
