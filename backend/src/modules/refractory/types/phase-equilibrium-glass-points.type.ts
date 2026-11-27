import type { ConfidenceLevel } from '../enums/confidence-level.enum';
import type { ViscosityModel } from '../enums/viscosity-model.enum';

/** ASTM-style glass points from a VTF glass-viscosity model (not slag models). */
export type PhaseEquilibriumGlassPoints = {
  model: ViscosityModel;
  confidence: ConfidenceLevel;
  /** η = 10¹³·⁵ Pa·s [°C] */
  strainPoint_C: number;
  /** Annealing point, η = 10¹² Pa·s [°C] */
  glassTransition_C: number;
  /** η = 10⁶·⁶ Pa·s [°C] */
  softeningPoint_C: number;
  /** η = 10³ Pa·s [°C] */
  workingPoint_C: number;
};
