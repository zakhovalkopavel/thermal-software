import { CompoundDataUnresolvedValue } from '../../types/dataset/compound-data-unresolved-value.type';

export interface CompoundDataUnresolvedEntry {
  cas: string | null;
  labels: string[];
  formulas: string[];
  reason: string;
  values: CompoundDataUnresolvedValue[];
}
