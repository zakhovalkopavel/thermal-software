import type { ComponentBreakdown } from './component-breakdown.type';
import type { FixedPoints } from './fixed-points.type';
import type { GlassViscosityMetadata } from './glass-viscosity-metadata.type';
import type { ModelInfo } from './model-info.type';
import type { ValidationStatus } from './validation-status.type';

/** Complete glass viscosity calculation result. */
export type GlassViscosityResult = {
  /** Calculated viscosity at given temperature */
  viscosity_Pas: number;

  /** Input temperature */
  temperature_C: number;

  /** Log10 of viscosity for easier comparison */
  logViscosity: number;

  /** Model information and parameters */
  model: ModelInfo;

  /** ASTM C965-96 fixed points */
  fixedPoints: FixedPoints;

  /** Composition validation and warnings */
  validation: ValidationStatus;

  /** Component breakdown and effects */
  components: ComponentBreakdown;

  /** Normalized composition used for calculation */
  composition: Record<string, number>;

  /** Metadata */
  metadata: GlassViscosityMetadata;
};
