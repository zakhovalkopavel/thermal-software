import { CompoundDataEquationValue } from '../equation/compound-data-equation-value.interface';
import { CompoundDataPhase } from '../property/compound-data-phase.type';
import { CompoundDataPropertyValue } from '../property/compound-data-property-value.interface';
import { CompoundDataRawValue } from '../property/compound-data-raw-value.interface';

export type CompoundDataUnresolvedValue = { property: string; phase: CompoundDataPhase | null } & (
  | CompoundDataPropertyValue
  | CompoundDataEquationValue
  | CompoundDataRawValue
);
