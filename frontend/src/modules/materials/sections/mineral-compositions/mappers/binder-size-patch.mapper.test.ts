import { describe, expect, it } from 'vitest';
import type { MaterialEntry } from '../../../types/material-entry.type';
import { MINERAL_COMPOSITIONS_UI } from '../constants/mineral-compositions-ui.constants';
import { toBinderSizePatch } from './binder-size-patch.mapper';

const binder = (overrides: Partial<MaterialEntry> = {}): MaterialEntry =>
  ({
    materialId: 'cac_ca70',
    name: 'Calcium Aluminate Cement (CA-70)',
    type: 'binder',
    materialGroup: ['binder', 'oxide'],
    orderNumber: 6,
    description: 'test',
    composition: { Al2O3: 70, CaO: 28 },
    rho_true_after_firing_kgm3: 3200,
    particleSize: { dMin_mm: 0.001, dMax_mm: 0.1, d50_mm: 0.015 },
    chemicalShrinkage_volFrac: 0.12,
    activationEnergy_Jmol: 420000,
    meltingPoint_C: 1600,
    ...overrides,
  }) as MaterialEntry;

describe('mineral-compositions › binder-size-patch', () => {
  it('maps a binder to the as-delivered material size', () => {
    expect(toBinderSizePatch(binder())).toEqual({
      sizeKey: MINERAL_COMPOSITIONS_UI.materialSizeKey,
      dMin_mm: 0.001,
      dMax_mm: 0.1,
      d50_mm: 0.015,
    });
  });

  it('keeps the material size key when a binder has no particleSize', () => {
    expect(toBinderSizePatch(binder({ particleSize: undefined }))).toEqual({
      sizeKey: MINERAL_COMPOSITIONS_UI.materialSizeKey,
      dMin_mm: null,
      dMax_mm: null,
      d50_mm: null,
    });
  });

  it('returns null for non-binders and missing entries', () => {
    expect(toBinderSizePatch(undefined)).toBeNull();
    expect(toBinderSizePatch(binder({ materialGroup: ['oxide'], type: 'aggregate' }))).toBeNull();
    expect(toBinderSizePatch(binder({ materialGroup: ['silicate', 'binder'], type: 'aggregate' }))).toBeNull();
  });
});
