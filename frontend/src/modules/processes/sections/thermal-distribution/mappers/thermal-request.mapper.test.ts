import { describe, expect, it } from 'vitest';
import { THERMAL_DEFAULTS } from '../constants/thermal-defaults.constants';
import { toThermalRequest } from './thermal-request.mapper';

const DRAFT = THERMAL_DEFAULTS;

describe('thermal-distribution › thermal-request', () => {
  it('maps the quenched steel cylinder example', () => {
    expect(toThermalRequest(DRAFT)).toMatchInlineSnapshot(`
      {
        "T0": 850,
        "Tc": 20,
        "alpha": 1200,
        "bcType": "BC_III",
        "initialProfile": "uniform",
        "lambda": 45,
        "shape": {
          "geometry": "cylinder",
          "radius": 0.05,
        },
        "tau": 60,
        "thermalDiffusivity": 0.000012,
      }
    `);
  });

  it('omits α for a prescribed surface temperature and adds the parabolic profile', () => {
    const request = toThermalRequest({
      ...DRAFT,
      bcType: 'BC_I',
      initialProfile: 'parabolic',
      values: { ...DRAFT.values, T0Ctr: 900, T0Surf: 700 },
    });
    expect(request).not.toHaveProperty('alpha');
    expect(request).toMatchObject({ T0Ctr: 900, T0Surf: 700 });
  });

  it('sends per-axis Bi for a parallelepiped only when all three are set', () => {
    const draft = {
      ...DRAFT,
      geometry: 'parallelepiped' as const,
      shape: { ...DRAFT.shape, halfX: 0.1, halfY: 0.05, halfZ: 0.02 },
      values: { ...DRAFT.values, bi1: 0.5, bi2: 1, bi3: 2 },
    };
    expect(toThermalRequest(draft)).toMatchObject({
      shape: { geometry: 'parallelepiped', halfX: 0.1, halfY: 0.05, halfZ: 0.02 },
      biPerAxis: [0.5, 1, 2],
    });
    expect(toThermalRequest({ ...draft, values: { ...draft.values, bi3: null } })).not.toHaveProperty('biPerAxis');
  });

  it('sends lateral and end Bi for a finite cylinder', () => {
    const request = toThermalRequest({
      ...DRAFT,
      geometry: 'finite_cylinder',
      shape: { ...DRAFT.shape, halfZ: 0.1 },
      values: { ...DRAFT.values, biLateral: 1.3, biEnd: 0.4 },
    });
    expect(request.biCylinder).toEqual([1.3, 0.4]);
  });

  it('names missing fields, including the shape and the convective α', () => {
    expect(() => toThermalRequest({ ...DRAFT, values: { ...DRAFT.values, alpha: null } })).toThrow('Enter Heat-transfer coefficient α.');
    expect(() => toThermalRequest({ ...DRAFT, shape: { ...DRAFT.shape, radius: null } })).toThrow('Enter Radius.');
  });
});
