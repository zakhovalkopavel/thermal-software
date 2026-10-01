import { describe, expect, it } from 'vitest';
import type { CondensedFuelDraft } from '../types/condensed-fuel-draft.type';
import { toCondensedFuel } from './condensed-fuel-request.mapper';

const WOOD: CondensedFuelDraft = {
  source: 'custom',
  fuelId: null,
  name: '  Dry beech  ',
  elemental: { C: 0.49, H: 0.06, O: 0.44, N: 0.002, S: null, ash: 0.008, moisture: 0 },
  energyBasis: 'lhv',
  properties: {
    energy_J_kg: 18.1e6,
    specificHeat_J_kgK: 1500,
    porosity: 0.45,
    bulkDensity_kg_m3: 380,
    particleSize_m: 0.03,
    activityFactor: 1,
    emissivity: null,
  },
};

describe('combustion › condensed-fuel-request', () => {
  it('maps a custom fuel without bed properties', () => {
    expect(toCondensedFuel(WOOD, false)).toMatchInlineSnapshot(`
      {
        "elementalComp": {
          "C": 0.49,
          "H": 0.06,
          "N": 0.002,
          "O": 0.44,
          "ash": 0.008,
          "moisture": 0,
        },
        "lhv_J_kg": 18100000,
        "name": "Dry beech",
        "specificHeat_J_kgK": 1500,
      }
    `);
  });

  it('adds the bed properties for the bed model', () => {
    expect(toCondensedFuel(WOOD, true)).toMatchObject({ porosity: 0.45, bulkDensity_kg_m3: 380, particleSize_m: 0.03, activityFactor: 1 });
  });

  it('sends the formation enthalpy and omits an empty name', () => {
    const fuel = toCondensedFuel({ ...WOOD, name: ' ', energyBasis: 'heatOfFormation', properties: { ...WOOD.properties, energy_J_kg: -5.2e6 } }, false);
    expect(fuel).toMatchObject({ heatOfFormation_J_kg: -5.2e6 });
    expect(fuel).not.toHaveProperty('lhv_J_kg');
    expect(fuel).not.toHaveProperty('name');
  });

  it('rejects missing elements, bed properties and energy', () => {
    expect(() => toCondensedFuel({ ...WOOD, elemental: { ...WOOD.elemental, C: null } }, false)).toThrow('Enter C.');
    expect(() => toCondensedFuel({ ...WOOD, properties: { ...WOOD.properties, porosity: null } }, true)).toThrow('Enter Bed porosity.');
    expect(() => toCondensedFuel({ ...WOOD, properties: { ...WOOD.properties, energy_J_kg: null } }, false)).toThrow(
      'Enter the lower heating value or the formation enthalpy of the fuel.',
    );
  });
});
