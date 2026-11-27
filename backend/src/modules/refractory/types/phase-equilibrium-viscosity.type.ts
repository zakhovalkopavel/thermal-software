import type { ConfidenceLevel } from '../enums/confidence-level.enum';
import type { ViscosityModel } from '../enums/viscosity-model.enum';

/** Melt viscosity of a liquid part at the firing temperature. */
export type PhaseEquilibriumViscosity = {
  /** Model of GlassViscosityService that was used */
  model: ViscosityModel;

  /** Confidence of the model for this composition */
  confidence: ConfidenceLevel;

  /** log10 of the viscosity [Pa·s] */
  logViscosity: number;

  /** Viscosity [Pa·s] */
  viscosity_Pas: number;
};
