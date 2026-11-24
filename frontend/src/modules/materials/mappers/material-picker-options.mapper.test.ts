import { describe, expect, it } from 'vitest';
import { recordedResponse } from '../../../../tests/setup/recorded-response';
import type { GasListEntry } from '../types/gas-list-entry.type';
import type { MaterialCategory } from '../types/material-category.type';
import type { MetalSummary } from '../types/metal-summary.type';
import type { RefractoryProductSummary } from '../types/refractory-product-summary.type';
import { toMaterialPickerOptions } from './material-picker-options.mapper';

const METALS = recordedResponse<MetalSummary[]>('GET /metals/list');
const REFRACTORIES = recordedResponse<RefractoryProductSummary[]>('GET /refractory/refractories');
const GASES = recordedResponse<GasListEntry[]>('GET /thermodynamics/fluid/list');
const CATEGORIES = recordedResponse<MaterialCategory[]>('GET /refractory/material-categories');

describe('materials › material-picker-options', () => {
  it('maps metals', () => {
    expect(toMaterialPickerOptions({ kind: 'metal', data: METALS })[0]).toMatchInlineSnapshot(`
      {
        "description": "Austenitic 18-8 stainless steel (18% Cr, 8% Ni). λ fit valid 300–1400 K.",
        "groupLabel": "Metals",
        "id": "aisi_304",
        "kind": "metal",
        "label": "AISI 304 stainless steel",
      }
    `);
  });

  it('maps refractories with their group in the group label', () => {
    const options = toMaterialPickerOptions({ kind: 'refractory', data: REFRACTORIES });
    expect(options).toHaveLength(REFRACTORIES.length);
    expect([...new Set(options.map((option) => option.groupLabel))]).toMatchInlineSnapshot(`
      [
        "Refractory products · Chamotte",
        "Refractory products · Mullite",
        "Refractory products · Quartz",
        "Refractory products · Alumina",
        "Refractory products · Carbide",
        "Refractory products · Insulation",
      ]
    `);
  });

  it('shows the gas formula only when it differs from the name', () => {
    const options = toMaterialPickerOptions({ kind: 'gas', data: GASES });
    expect(options.slice(0, 3).map((option) => option.label)).toMatchInlineSnapshot(`
      [
        "Argon (Ar)",
        "Nitrogen (N2)",
        "Oxygen (O2)",
      ]
    `);
  });

  it('filters library categories by group', () => {
    const options = toMaterialPickerOptions({ kind: 'library', data: CATEGORIES }, ['oxide']);
    expect(new Set(options.map((option) => option.groupLabel))).toEqual(new Set(['Oxides']));
    expect(options.every((option) => option.kind === 'library')).toBe(true);
  });

  it('keeps every library material without a filter', () => {
    const total = CATEGORIES.reduce((sum, category) => sum + category.materials.length, 0);
    expect(toMaterialPickerOptions({ kind: 'mix-component', data: CATEGORIES })).toHaveLength(total);
  });
});
