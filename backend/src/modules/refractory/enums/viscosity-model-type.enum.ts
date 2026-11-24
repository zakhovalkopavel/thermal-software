/**
 * Viscosity constitutive-equation family used by a published model.
 */
export enum ViscosityModelType {
  ARRHENIUS       = 'ARRHENIUS',
  /** Modified Weymann-Frenkel: η = A·η₀·exp(E/B_i*). Used by Iida model. */
  WEYMANN_FRENKEL = 'WEYMANN_FRENKEL',
  /** Modified Arrhenius: η = A·T·exp(E/RT). Used by Nakamoto 2007. */
  ARRHENIUS_T     = 'ARRHENIUS_T',
  VFT             = 'VFT',
}
