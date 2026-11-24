import { describe, expect, it } from 'vitest';
import { recordedResponse } from '../../../../../../tests/setup/recorded-response';
import type { MaterialCategory } from '../../../types/material-category.type';
import { toReferencePropertyRows } from './reference-property-rows.mapper';

const CATEGORIES = recordedResponse<MaterialCategory[]>('GET /refractory/material-categories');
const CALCINED_ALUMINA = CATEGORIES.flatMap((category) => category.materials).find(
  (material) => material.materialId === 'alumina_calcined',
);

describe('raw-materials › reference-property-rows', () => {
  it('lists the properties the recorded material has, in field order', () => {
    expect(CALCINED_ALUMINA).toBeDefined();
    expect(toReferencePropertyRows(CALCINED_ALUMINA!)).toMatchInlineSnapshot(`
      [
        {
          "key": "thermalConductivity",
          "label": "λ",
          "unit": "W/(m·K)",
          "value": 28,
        },
        {
          "key": "specificHeat",
          "label": "Cp",
          "unit": "J/(kg·K)",
          "value": 870,
        },
        {
          "digits": 3,
          "key": "thermalExpansion",
          "label": "α",
          "unit": "1/K",
          "value": 0.0000078,
        },
        {
          "key": "trueDensity",
          "label": "True density after firing",
          "unit": "kg/m³",
          "value": 3900,
        },
        {
          "key": "meltingPoint",
          "label": "Melting point",
          "unit": "°C",
          "value": 2050,
        },
        {
          "key": "chemicalShrinkage",
          "label": "Chemical shrinkage",
          "unit": "vol. fraction",
          "value": 0.003,
        },
        {
          "key": "activationEnergy",
          "label": "Activation energy",
          "unit": "J/mol",
          "value": 560000,
        },
        {
          "key": "crushingStrength",
          "label": "Crushing strength",
          "unit": "MPa",
          "value": 180,
        },
        {
          "key": "hardness",
          "label": "Hardness",
          "unit": "HV",
          "value": 1700,
        },
      ]
    `);
  });

  it('skips optional properties the material does not have', () => {
    const rows = toReferencePropertyRows({ ...CALCINED_ALUMINA!, thermalProperties: undefined, mechanicalProperties: undefined });
    expect(rows.map((row) => row.key)).toEqual([
      'trueDensity',
      'meltingPoint',
      'chemicalShrinkage',
      'activationEnergy',
    ]);
  });
});
