import type { FluidMode } from './fluid-mode.type';
import type { HtcFieldKey } from './htc-field-key.type';

export type HtcDraft = {
  geometry: string;
  dims: Record<string, number | null>;
  fluidMode: FluidMode;
  fluid: string;
  composition: Record<string, number>;
  values: Record<HtcFieldKey, number | null>;
  /** Empty string = let the backend choose. */
  forceRegime: string;
  /** Empty string = let the backend choose. */
  preferredCorrelation: string;
  isHeating: boolean;
  compareAll: boolean;
};
