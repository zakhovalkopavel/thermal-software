import { describe, expect, it } from 'vitest';
import { MINERAL_COMPOSITIONS_UI } from '../constants/mineral-compositions-ui.constants';
import { toNewMixFraction } from '../mappers/new-mix-fraction.mapper';
import type { MixState } from '../types/mix-state.type';
import { mixReducer } from './mix.reducer';

const row = (overrides: Partial<ReturnType<typeof toNewMixFraction>> = {}) => ({
  ...toNewMixFraction(),
  ...overrides,
});

const stateOf = (...fractions: ReturnType<typeof row>[]): MixState => ({
  fractions,
  phi: null,
  porosity: null,
  packingModel: null,
});

describe('mineral-compositions › mix.reducer', () => {
  it('sets binder size when a binder material is selected', () => {
    const fraction = row({ id: 'f1' });
    const next = mixReducer(stateOf(fraction), {
      type: 'update',
      id: 'f1',
      patch: {
        materialId: 'cac_ca70',
        density_kgm3: 3200,
        sizeKey: MINERAL_COMPOSITIONS_UI.materialSizeKey,
        dMin_mm: 0.001,
        dMax_mm: 0.1,
        d50_mm: 0.015,
      },
    });
    expect(next.fractions[0]).toMatchObject({
      materialId: 'cac_ca70',
      sizeKey: MINERAL_COMPOSITIONS_UI.materialSizeKey,
      dMin_mm: 0.001,
      dMax_mm: 0.1,
      d50_mm: 0.015,
    });
  });

  it('ignores size patches on a binder row', () => {
    const fraction = row({
      id: 'f1',
      materialId: 'cac_ca70',
      sizeKey: MINERAL_COMPOSITIONS_UI.materialSizeKey,
      dMin_mm: 0.001,
      dMax_mm: 0.1,
      d50_mm: 0.015,
      massPercent: 15,
    });
    const next = mixReducer(stateOf(fraction), {
      type: 'update',
      id: 'f1',
      patch: { sizeKey: 'standard:ULTRAFINE', dMin_mm: 0.001, dMax_mm: 0.01, d50_mm: 0.005, massPercent: 20 },
    });
    expect(next.fractions[0]).toMatchObject({
      sizeKey: MINERAL_COMPOSITIONS_UI.materialSizeKey,
      dMin_mm: 0.001,
      dMax_mm: 0.1,
      d50_mm: 0.015,
      massPercent: 20,
    });
  });

  it('clears size when switching from a binder to another material', () => {
    const fraction = row({
      id: 'f1',
      materialId: 'cac_ca70',
      sizeKey: MINERAL_COMPOSITIONS_UI.materialSizeKey,
      dMin_mm: 0.001,
      dMax_mm: 0.1,
      d50_mm: 0.015,
      density_kgm3: 3200,
    });
    const next = mixReducer(stateOf(fraction), {
      type: 'update',
      id: 'f1',
      patch: {
        materialId: 'alumina_tabular',
        density_kgm3: 3550,
        sizeKey: null,
        dMin_mm: null,
        dMax_mm: null,
        d50_mm: null,
      },
    });
    expect(next.fractions[0]).toMatchObject({
      materialId: 'alumina_tabular',
      sizeKey: null,
      dMin_mm: null,
      dMax_mm: null,
      d50_mm: null,
      density_kgm3: 3550,
    });
  });

  it('replaces a picked size when switching to a binder', () => {
    const fraction = row({
      id: 'f1',
      materialId: 'alumina_tabular',
      sizeKey: 'standard:COARSE_6_3',
      dMin_mm: 3,
      dMax_mm: 6,
      d50_mm: 4.5,
      density_kgm3: 3550,
    });
    const next = mixReducer(stateOf(fraction), {
      type: 'update',
      id: 'f1',
      patch: {
        materialId: 'cac_ca70',
        density_kgm3: 3200,
        sizeKey: MINERAL_COMPOSITIONS_UI.materialSizeKey,
        dMin_mm: 0.001,
        dMax_mm: 0.1,
        d50_mm: 0.015,
      },
    });
    expect(next.fractions[0]).toMatchObject({
      materialId: 'cac_ca70',
      sizeKey: MINERAL_COMPOSITIONS_UI.materialSizeKey,
      dMin_mm: 0.001,
      dMax_mm: 0.1,
      d50_mm: 0.015,
    });
  });
});
