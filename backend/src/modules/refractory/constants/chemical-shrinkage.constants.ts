/**
 * Default chemical shrinkage coefficients (volumetric fraction per w/c × cement).
 * Powers & Brownyard (1946); CAC higher than Portland.
 */
export const CHEMICAL_SHRINKAGE = {
  PC: 0.064,
  CAC: 0.12,
  gypsum: 0.025,
  generic: 0.08,
} as const;
