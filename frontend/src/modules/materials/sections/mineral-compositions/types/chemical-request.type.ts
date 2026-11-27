import type { OxideComposition } from '../../../types/oxide-composition.type';
import type { AlgorithmMode } from './algorithm-mode.type';
import type { LegacyVariant } from './legacy-variant.type';
import type { PhaseEquilibriumFractionInput } from './phase-equilibrium-fraction-input.type';

export type ChemicalRequest = {
  /** Size fractions of the mix for the phase-equilibrium API. */
  fractions: PhaseEquilibriumFractionInput[];
  /** h */
  holdTime_hours: number;
  algorithmMode: AlgorithmMode;
  /** Used only when `algorithmMode` is `legacy` or `compare`. */
  legacyVariant: LegacyVariant;
  /** `acceptedOxides_normalized` of the mix; used by mineral phases only. */
  composition: OxideComposition;
  /** °C */
  temperature: number;
  totalMass: number;
  /** 0–0.95; packing porosity or an override for `/mix/thermal`. */
  porosity: number;
  /** °C grid of the liquid-fraction and λ_eff sweeps. */
  grid: number[];
};
