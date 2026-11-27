import { ConfidenceLevel } from '../enums/confidence-level.enum';
import type { ViscosityModel } from '../enums/viscosity-model.enum';
import type { GlassViscosityResult } from '../types/glass-viscosity-result.type';
import type { PhaseEquilibriumViscosity } from '../types/phase-equilibrium-viscosity.type';
import type { SlagViscosityResult } from '../types/slag-viscosity-result.type';

/**
 * Reduces the glass or slag result of `GlassViscosityService` to the viscosity block of the
 * phase-equilibrium response. Slag models (Iida, Nakamoto) carry no validation status and are
 * reported with LOW confidence; a non-finite viscosity (below the liquidus) yields null.
 */
export class MeltViscosityAdapter {
  static adapt(result: GlassViscosityResult | SlagViscosityResult): PhaseEquilibriumViscosity | null {
    if ('thermalState' in result) {
      if (!Number.isFinite(result.viscosity_Pas)) return null;
      return {
        model: result.model as ViscosityModel,
        confidence: ConfidenceLevel.LOW,
        logViscosity: result.logViscosity_Pas,
        viscosity_Pas: result.viscosity_Pas,
      };
    }
    return {
      model: result.model.systemType,
      confidence: result.validation.confidenceLevel,
      logViscosity: result.logViscosity,
      viscosity_Pas: result.viscosity_Pas,
    };
  }
}
