import type { DimensionlessResult } from '../../../src/modules/processes/sections/htc/types/dimensionless-result.type';

/** Turbulent flue gas in a 50 mm pipe; override what the test compares. */
export function dimensionlessResult(overrides: Partial<DimensionlessResult> = {}): DimensionlessResult {
  return {
    Re: 12000,
    Pr: 0.72,
    Gr: 3.1e5,
    Ra: 2.2e5,
    Nu: 38.5,
    h_W_m2K: 61.6,
    correlation: 'gnielinski',
    regime: 'turbulent',
    isNatural: false,
    rangeValid: true,
    ...overrides,
  };
}
