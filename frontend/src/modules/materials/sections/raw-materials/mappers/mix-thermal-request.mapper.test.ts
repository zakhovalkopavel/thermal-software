import { describe, expect, it } from 'vitest';
import { toMixThermalRequest } from './mix-thermal-request.mapper';

describe('raw-materials › mix-thermal-request', () => {
  it('sends the material alone with all °C temperatures and the porosity', () => {
    expect(toMixThermalRequest('silicon_carbide', [20, 600], 0.2)).toEqual({
      fractions: [{ materialId: 'silicon_carbide', massFraction: 1 }],
      temperatures_C: [20, 600],
      porosity: 0.2,
    });
  });
});
