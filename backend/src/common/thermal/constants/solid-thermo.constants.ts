import type { GaussNodeCount } from '../../utils/quadrature';

/** Numerical settings of the Cp-integral thermochemistry path (`SolidThermoFromCp`) */
export const SOLID_THERMO: {
  /** Maximum width of one Gauss–Legendre panel for ∫Cp/T dT [K] */
  ENTROPY_PANEL_WIDTH_K: number;
  /** Gauss–Legendre nodes per panel */
  ENTROPY_PANEL_NODES: GaussNodeCount;
} = {
  ENTROPY_PANEL_WIDTH_K: 250,
  ENTROPY_PANEL_NODES: 16,
};
