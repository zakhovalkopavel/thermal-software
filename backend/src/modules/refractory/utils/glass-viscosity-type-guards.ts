import type { ASTMFixedPoint } from '../types/astm-fixed-point.type';
import type { GlassViscosityInput } from '../types/glass-viscosity-input.type';
import type { GlassViscosityResult } from '../types/glass-viscosity-result.type';

/**
 * Runtime type guards for glass-viscosity shapes.
 * Stateless — no DI.
 */
export class GlassViscosityTypeGuards {
  static isGlassViscosityInput(obj: any): obj is GlassViscosityInput {
    return (
      typeof obj === 'object' &&
      typeof obj.composition === 'object' &&
      typeof obj.temperature === 'number'
    );
  }

  static isGlassViscosityResult(obj: any): obj is GlassViscosityResult {
    return (
      typeof obj === 'object' &&
      typeof obj.viscosity_Pas === 'number' &&
      typeof obj.temperature === 'number' &&
      typeof obj.composition === 'object' &&
      typeof obj.fixedPoints === 'object' &&
      typeof obj.metadata === 'object'
    );
  }

  static isASTMFixedPoint(obj: any): obj is ASTMFixedPoint {
    return (
      typeof obj === 'object' &&
      typeof obj.name === 'string' &&
      typeof obj.temperature_C === 'number' &&
      typeof obj.viscosity_Pas === 'number'
    );
  }
}
