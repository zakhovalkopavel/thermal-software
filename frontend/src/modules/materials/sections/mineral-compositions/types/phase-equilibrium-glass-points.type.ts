/** ASTM-style glass points from a VTF glass-viscosity model (not slag models). */
export type PhaseEquilibriumGlassPoints = {
  model: string;
  confidence: string;
  strainPoint_C: number;
  glassTransition_C: number;
  softeningPoint_C: number;
  workingPoint_C: number;
};
