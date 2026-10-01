import { describe, expect, it } from 'vitest';
import { roundComposition } from './round-composition';

describe('calc › roundComposition', () => {
  it('rounds every component to the given decimals', () => {
    expect(roundComposition({ SiO2: 72.456, Na2O: 13.5, Fe2O3: 0.049 }, 1)).toEqual({ SiO2: 72.5, Na2O: 13.5, Fe2O3: 0 });
  });
});
