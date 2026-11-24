import type { ViscosityModel } from '../enums/viscosity-model.enum';

/** Model selection outcome for glass/slag viscosity. */
export type ModelSelectionResult = {
  primary: ViscosityModel;
  secondary?: ViscosityModel;
  /** Reason for selection */
  reason: string;
  /** Composition range warnings */
  warnings: string[];
  /**
   * Set when a preferred model was requested but could not be used and was
   * replaced by the auto-selected primary.
   * Value is the model that was requested but rejected.
   */
  preferredModelRejected?: ViscosityModel;
  /** Human-readable explanation of why the preferred model was replaced */
  preferredModelRejectionReason?: string;
};
