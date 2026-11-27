import type { PhaseEquilibriumGlassPoints } from './phase-equilibrium-glass-points.type';
import type { PhaseEquilibriumViscosity } from './phase-equilibrium-viscosity.type';

/** Viscosity at T plus optional glass points from one GlassViscosityService call. */
export type MeltPropertyBundle = {
  viscosity: PhaseEquilibriumViscosity | null;
  glassPoints: PhaseEquilibriumGlassPoints | null;
};
