import { CompoundDataPhase } from '../../types/property/compound-data-phase.type';
import { CompoundDataRef } from '../../types/property/compound-data-ref.type';

/**
 * Source row kept verbatim because it cannot become an equation
 * (Perry 2-151 rows without Tmin/Tmax; `values.unit` gives their unit, e.g. "cal/(mol K)").
 *
 * Huber2019 gas viscosity also stores `points`, `bestEquation`, `mape_pct` and `max_abs_pct`
 * (precision of the preferred equation vs that table).
 */
export interface CompoundDataRawValue {
  property: string;
  phase: CompoundDataPhase;
  values: Record<string, unknown>;
  variant?: string;
  error?: number | string;
  ref: CompoundDataRef;
}
