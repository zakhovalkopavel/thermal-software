import type { PhaseEquilibriumFractionInput } from './phase-equilibrium-fraction-input.type';

export type ChemicalRequest = {
  /** Size fractions of the mix for the phase-equilibrium API. */
  fractions: PhaseEquilibriumFractionInput[];
  /** h */
  holdTime_hours: number;
  /** °C */
  temperature: number;
  totalMass: number;
  /** 0–0.95; packing porosity or an override for `/mix/thermal`. */
  porosity: number;
  /** °C grid of the liquid-fraction and λ_eff sweeps. */
  grid: number[];
};
