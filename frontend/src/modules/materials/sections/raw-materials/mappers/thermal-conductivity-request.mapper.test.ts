import { describe, expect, it } from 'vitest';
import { toThermalConductivityRequest } from './thermal-conductivity-request.mapper';

describe('raw-materials › thermal-conductivity-request', () => {
  it('sends the normalized composition, °C temperature and porosity', () => {
    expect(toThermalConductivityRequest({ SiO2: 54.8, Al2O3: 45.2 }, 1000, 0.2)).toEqual({
      composition: { SiO2: 54.8, Al2O3: 45.2 },
      temperature: 1000,
      porosity: 0.2,
    });
  });
});
