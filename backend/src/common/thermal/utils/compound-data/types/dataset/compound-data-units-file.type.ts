import { CompoundDataEquations } from '../equation/compound-data-equations.type';
import { CompoundDataProperties } from '../property/compound-data-properties.type';
import { CompoundDataTransportMethod } from '../transport/compound-data-transport-method.type';

/** `units.json`: unit of every value in the dataset (SI), e.g. "J/(mol K)", "kg/m3", "1" (dimensionless) */
export type CompoundDataUnitsFile = {
  $comment: string;
  /** `CompoundDataRecord.Mr`: "kg/mol" */
  Mr: string;
  /** Equation temperature `T`, `min` and `max`: "K" */
  temperature: string;
  properties: Partial<Record<keyof CompoundDataProperties, string>>;
  /** Result unit of each equation property (after `k`) */
  equations: Partial<Record<keyof CompoundDataEquations, string>>;
  /** Numeric fields of `CompoundDataTransportMethod` and `CompoundDataInteraction`, e.g. sigma "m", TminK "K" */
  transport: Partial<Record<keyof CompoundDataTransportMethod | 'matchTemperatureK', string>>;
}
