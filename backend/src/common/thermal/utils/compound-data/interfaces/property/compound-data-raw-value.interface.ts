import { CompoundDataPhase } from './compound-data-phase.type';
import { CompoundDataRef } from './compound-data-ref.type';

/**
 * Source row kept verbatim because it cannot become an equation
 * (Perry 2-151 rows without Tmin/Tmax; `values.unit` gives their unit, e.g. "cal/(mol K)").
 */
export interface CompoundDataRawValue {
  property: string;
  phase: CompoundDataPhase;
  values: Record<string, number | string | null>;
  variant?: string;
  error?: number | string;
  ref: CompoundDataRef;
}
