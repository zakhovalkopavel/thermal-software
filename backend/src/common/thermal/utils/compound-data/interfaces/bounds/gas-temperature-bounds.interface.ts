import { BoilingPointSource } from './boiling-point-source.type';

/**
 * Gas-state temperature window for a compound at pressure P.
 * `Tmin_K` is the boiling temperature at P when known.
 */
export interface GasTemperatureBounds {
  id: string;
  cas: string | null;
  name: string;
  formula: string;
  displayFormula: string;
  P_Pa: number;
  /** Lower bound for gas-phase calculations: boiling temperature at P when known. */
  Tmin_K: number | null;
  /** Upper bound from gas equation ranges (min of published maxima). */
  Tmax_K: number | null;
  boilingPoint_K: number | null;
  boilingPointSource: BoilingPointSource | null;
  normalBoilingPoint_K: number | null;
  message?: string;
}
