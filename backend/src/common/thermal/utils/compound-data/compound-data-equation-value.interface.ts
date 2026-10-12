import { RefKey } from '../../enum/ref-key.enum';
import { CompoundDataEquationType } from './compound-data-equation-type.type';
import { CompoundDataRef } from './compound-data-ref.type';

/**
 * Coefficient row in the `EquationValue` shape, with `ref` as the source row tuple.
 * The result unit is fixed per property (`CompoundDataEquations`).
 */
export interface CompoundDataEquationValue {
  type: CompoundDataEquationType;
  ref: CompoundDataRef;
  vars: Record<string, unknown>;
  /** Valid temperature range min [K]; `null` when the source gives no range (VDI gas tables) */
  min: number | null;
  /** Valid temperature range max [K]; `null` like `min` */
  max: number | null;
  /** Scaling factor applied after equation evaluation */
  k?: number;
  /** Polymorph or modification, e.g. "α", "quartz, β", "glass" (Perry 2-151 subphase) */
  variant?: string;
  /** Fit error [%] (Perry 2-151, White3 Tables 1-2 / 1-3: ± over [min, max]); footnoted cells stay text, e.g. "1a" */
  error?: number | string;
  /** Reference the source table was taken from, e.g. White3 Table 1-2 ← NBS1955 */
  originalRef?: RefKey;
  /** Zabransky data type: "sat" (saturation) or "p" (constant pressure) */
  dataType?: string;
  /** Zabransky uncertainty class (I–V); per range when the chained ranges differ */
  uncertainty?: string | string[];
  /** Row the critical temperature `vars.Tc` was taken from (DIPPR 114 ← Yaws) */
  tcRef?: CompoundDataRef;
  /** Row `min = Tm` / `max = Tc` were taken from (VDI liquid tables) */
  rangeRef?: CompoundDataRef;
  /** Verbatim source values when the equation vars are derived from them (CRC molten densities) */
  raw?: Record<string, number | null>;
}
