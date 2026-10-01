import { describe, expect, it } from 'vitest';
import { pickOxides } from './pick-oxides';

describe('calc › pickOxides', () => {
  it('splits a composition into allowed and ignored oxides', () => {
    expect(pickOxides({ SiO2: 72.5, Na2O: 13.5, SO3: 0.25, B2O3: 1 }, ['SiO2', 'Na2O', 'CaO'])).toEqual({
      kept: { SiO2: 72.5, Na2O: 13.5 },
      ignored: { SO3: 0.25, B2O3: 1 },
    });
  });
});
