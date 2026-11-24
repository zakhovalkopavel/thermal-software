/** Material definition for shrinkage calculation. */
export type ShrinkageMaterial = {
  /** Optional material identifier */
  id?: string;

  /** Material name */
  name: string;

  /** Activation energy for sintering (J/mol) */
  activationEnergy_Jmol?: number;

  /** Prefactor for sintering kinetics */
  prefactor?: number;

  /** Target relative density for sintering (0-1) */
  targetDensity?: number;
};
