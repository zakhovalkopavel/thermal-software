import { WorkabilityType } from '../enums/workability.enum';

/**
 * Water demand factors, limits, and typical ranges.
 * Refs: de Larrard (1999), Banerjee (2004), Pileggi et al. (2001).
 */
export const WATER_DEMAND_CONSTANTS = {
  WORKABILITY_FACTORS: {
    [WorkabilityType.FIRM]: 0.38,
    [WorkabilityType.STANDARD]: 0.42,
    [WorkabilityType.FLOWABLE]: 0.50,
  } as Record<WorkabilityType, number>,
  MIN_PACKING_FRACTION: 0.0,
  MAX_PACKING_FRACTION: 1.0,
  MAX_WATER_DEMAND: 50.0,
  MIN_WATER_DEMAND: 0.0,
  DECIMAL_PLACES: 1,
  DEFAULT_WORKABILITY: WorkabilityType.STANDARD,
  POROSITY_DECIMAL_PLACES: 1,
  TYPICAL_RANGES: {
    highAlumina: { min: 9, max: 12, typical: 10.9 },
    magnesia: { min: 8, max: 10, typical: 9.2 },
    ultraDense: { min: 7, max: 9, typical: 8.4 },
    selfFlowing: { min: 11, max: 15, typical: 13.5 },
    vibratable: { min: 9, max: 12, typical: 10.5 },
  },
} as const;
