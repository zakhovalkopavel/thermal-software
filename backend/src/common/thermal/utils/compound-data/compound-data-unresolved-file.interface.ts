import { CompoundDataEquationValue } from './compound-data-equation-value.interface';
import { CompoundDataPhase } from './compound-data-phase.type';
import { CompoundDataPropertyValue } from './compound-data-property-value.interface';
import { CompoundDataRawValue } from './compound-data-raw-value.interface';

export type CompoundDataUnresolvedValue = { property: string; phase: CompoundDataPhase | null } & (
  | CompoundDataPropertyValue
  | CompoundDataEquationValue
  | CompoundDataRawValue
);

export interface CompoundDataUnresolvedEntry {
  cas: string | null;
  labels: string[];
  formulas: string[];
  reason: string;
  values: CompoundDataUnresolvedValue[];
}

/** `unresolved.json`: source rows whose CAS or formula could not be resolved */
export interface CompoundDataUnresolvedFile {
  generatedAt: string;
  count: number;
  entries: CompoundDataUnresolvedEntry[];
}
