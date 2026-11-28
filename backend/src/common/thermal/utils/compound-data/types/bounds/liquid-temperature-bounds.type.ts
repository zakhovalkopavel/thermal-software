import { BoilingPointSource } from '../../types/bounds/boiling-point-source.type';

/**
 * Liquid-state temperature window for a compound at pressure P.
 * Capable only when liquid μ, λ, ρ and Cp equations exist.
 */
export type LiquidTemperatureBounds = {
  id: string;
  cas: string | null;
  name: string;
  formula: string;
  displayFormula: string;
  P_Pa: number;
  /** True when liquid transport (μ, λ, ρ, Cp) is available. */
  capable: boolean;
  /** Lower bound: melting point or min of liquid equation mins. */
  Tmin_K: number | null;
  /** Upper bound: boiling temperature at P, capped by liquid equation maxes. */
  Tmax_K: number | null;
  meltingPoint_K: number | null;
  boilingPoint_K: number | null;
  boilingPointSource: BoilingPointSource | null;
  normalBoilingPoint_K: number | null;
  message?: string;
}
