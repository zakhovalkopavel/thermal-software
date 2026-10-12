import { CompoundDataEquations } from './compound-data-equations.interface';
import { CompoundDataProperties } from './compound-data-properties.interface';
import { CompoundDataTransportMethod } from './compound-data-transport.interface';

/** `units.json`: unit of every value in the dataset (SI), e.g. "J/(mol K)", "kg/m3", "1" (dimensionless) */
export interface CompoundDataUnitsFile {
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
