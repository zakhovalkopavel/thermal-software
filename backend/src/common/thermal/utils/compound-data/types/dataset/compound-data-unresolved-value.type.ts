import { CompoundDataEquationValue } from '../../types/equation/compound-data-equation-value.type';
import { CompoundDataPhase } from '../property/compound-data-phase.type';
import { CompoundDataPropertyValue } from '../../types/property/compound-data-property-value.type';
import { CompoundDataRawValue } from '../../types/property/compound-data-raw-value.type';

export type CompoundDataUnresolvedValue = { property: string; phase: CompoundDataPhase | null } & (
  | CompoundDataPropertyValue
  | CompoundDataEquationValue
  | CompoundDataRawValue
);
