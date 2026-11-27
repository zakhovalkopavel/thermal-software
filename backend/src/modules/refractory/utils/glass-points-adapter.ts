import type { GlassViscosityResult } from '../types/glass-viscosity-result.type';
import type { PhaseEquilibriumGlassPoints } from '../types/phase-equilibrium-glass-points.type';
import type { SlagViscosityResult } from '../types/slag-viscosity-result.type';

/**
 * Maps a glass-viscosity result to API glass points.
 * Slag models (Iida, Nakamoto) have no VTF fixed points → null.
 */
export class GlassPointsAdapter {
  static adapt(result: GlassViscosityResult | SlagViscosityResult): PhaseEquilibriumGlassPoints | null {
    if ('thermalState' in result) return null;
    if (!result.fixedPoints) return null;
    const { strainPoint_C, annealingPoint_C, softeningPoint_C, workingPoint_C } = result.fixedPoints;
    if (![strainPoint_C, annealingPoint_C, softeningPoint_C, workingPoint_C].every(Number.isFinite)) {
      return null;
    }
    return {
      model: result.model.systemType,
      confidence: result.validation.confidenceLevel,
      strainPoint_C,
      glassTransition_C: annealingPoint_C,
      softeningPoint_C,
      workingPoint_C,
    };
  }
}
