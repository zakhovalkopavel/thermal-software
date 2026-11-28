import { describe, expect, it } from 'vitest';
import { recordedResponse } from '../../../../../../tests/setup/recorded-response';
import { HTC_DEFAULTS } from '../constants/htc-defaults.constants';
import type { FlowGeometryInfo } from '../types/flow-geometry-info.type';
import { toDimensionlessInput } from './dimensionless-request.mapper';

const GEOMETRIES = recordedResponse<FlowGeometryInfo[]>('GET /thermodynamics/geometry/list');
const geometry = (key: string) => GEOMETRIES.find((item) => item.key === key)!;
const DRAFT = HTC_DEFAULTS.draft;

describe('htc › dimensionless-request', () => {
  it('maps the default flue-gas form', () => {
    expect(toDimensionlessInput(DRAFT, geometry('pipe_circular'))).toMatchInlineSnapshot(`
      {
        "T_fluid_K": 1200,
        "T_surface_K": 800,
        "compareAll": true,
        "composition": {
          "CO2": 0.12,
          "H2O": 0.1,
          "N2": 0.72,
          "O2": 0.06,
        },
        "dimensions": {
          "a": 0.05,
        },
        "fluid": "gas_mix",
        "geometry": "pipe_circular",
        "isHeating": false,
        "w_m_s": 5,
      }
    `);
  });

  it('sends a named fluid with the forced regime and preferred correlation', () => {
    const input = toDimensionlessInput(
      { ...DRAFT, fluidMode: 'named', fluid: 'N2', forceRegime: 'turbulent', preferredCorrelation: 'dittus_boelter', dims: { a: 0.05, L: 2 } },
      geometry('pipe_circular'),
    );
    expect(input).toMatchObject({ fluid: 'N2', forceRegime: 'turbulent', preferredCorrelation: 'dittus_boelter', dimensions: { a: 0.05, L: 2 } });
    expect(input).not.toHaveProperty('composition');
  });

  it('rejects a missing temperature, dimension or fluid', () => {
    expect(() => toDimensionlessInput({ ...DRAFT, values: { ...DRAFT.values, T_fluid_K: null } }, geometry('pipe_circular'))).toThrow(
      'Enter Fluid temperature.',
    );
    expect(() => toDimensionlessInput(DRAFT, geometry('pipe_annulus'))).toThrow('Enter dimension b.');
    expect(() => toDimensionlessInput({ ...DRAFT, fluidMode: 'named', fluid: '' }, geometry('pipe_circular'))).toThrow('Select a fluid.');
  });

  it('sends a liquid catalogue compound with phase liquid', () => {
    const input = toDimensionlessInput(
      {
        ...DRAFT,
        fluidMode: 'liquid',
        liquidCompound: { source: 'compound', id: 'water', label: 'water' },
        values: { ...DRAFT.values, T_fluid_K: 300, T_surface_K: 320, w_m_s: 1 },
      },
      geometry('pipe_circular'),
    );
    expect(input).toMatchObject({
      compoundId: 'water',
      phase: 'liquid',
      geometry: 'pipe_circular',
      T_fluid_K: 300,
    });
    expect(input).not.toHaveProperty('fluid');
    expect(input).not.toHaveProperty('composition');
  });

  it('rejects liquid mode without a compound', () => {
    expect(() => toDimensionlessInput({ ...DRAFT, fluidMode: 'liquid', liquidCompound: null }, geometry('pipe_circular'))).toThrow(
      'Select a liquid.',
    );
  });
});
