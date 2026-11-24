/** Particle size fraction with material properties (blend optimizer). */
export type Fraction = {
  /** Optional material identifier for traceability */
  materialId?: string;

  /** Minimum particle size (mm) */
  dMin_mm: number;

  /** Maximum particle size (mm) */
  dMax_mm: number;

  /** Whether fraction size is fixed or can be adjusted */
  isFixed?: boolean;

  /** Mass fraction in blend (0-1) */
  massFraction?: number;

  /** Material density (kg/m³) — defaults to 2700 if not provided */
  density_kgm3?: number;
};
