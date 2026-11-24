/** Particle size fraction definition. */
export type PSDFraction = {
  /** Minimum particle diameter (mm) */
  dMin_mm: number;

  /** Maximum particle diameter (mm) */
  dMax_mm: number;

  /** Whether this fraction size is fixed (cannot be optimized) */
  isFixed?: boolean;

  /** Mass fraction for this size class (0-1) */
  massFraction?: number;
};
