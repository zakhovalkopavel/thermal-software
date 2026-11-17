import { CompoundDataEquationValue } from '../../interfaces/equation/compound-data-equation-value.interface';
import { CompoundDataPhase } from '../property/compound-data-phase.type';
import { CompoundDataPropertyValue } from '../../interfaces/property/compound-data-property-value.interface';
import { CompoundDataRawValue } from '../../interfaces/property/compound-data-raw-value.interface';

export type CompoundDataUnresolvedValue = { property: string; phase: CompoundDataPhase | null } & (
  | CompoundDataPropertyValue
  | CompoundDataEquationValue
  | CompoundDataRawValue
);
