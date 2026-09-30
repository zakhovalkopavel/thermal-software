import type { MaterialEntry } from '../../../types/material-entry.type';
import type { useGlassCalculation } from '../hooks/useGlassCalculation';
import type { GlassCalculationRequest } from './glass-calculation-request.type';

export type GlassResultsProps = {
  request: GlassCalculationRequest;
  result: ReturnType<typeof useGlassCalculation>;
  /** Library entry when the user glass is an unedited preset. */
  presetEntry: MaterialEntry | null;
};
