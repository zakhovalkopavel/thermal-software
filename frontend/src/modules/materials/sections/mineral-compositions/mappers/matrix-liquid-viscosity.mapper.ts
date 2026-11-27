import type { PhaseEquilibriumBlock } from '../types/phase-equilibrium-block.type';
import type { PhaseEquilibriumViscosity } from '../types/phase-equilibrium-viscosity.type';

/** Viscosity of the matrix liquid part, if the backend attached one. */
export function matrixLiquidViscosity(liquid: PhaseEquilibriumBlock): PhaseEquilibriumViscosity | null {
  const part = liquid.parts?.find((entry) => entry.source === 'matrix') ?? liquid.parts?.[0];
  return part?.viscosity ?? null;
}
