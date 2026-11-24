import { describe, expect, it } from 'vitest';
import { recordedResponse } from '../../../../../../tests/setup/recorded-response';
import type { FlowGeometryInfo } from '../types/flow-geometry-info.type';
import { toDimensionFieldSpecs } from './dimension-field-specs.mapper';

const GEOMETRIES = recordedResponse<FlowGeometryInfo[]>('GET /thermodynamics/geometry/list');

describe('htc › dimension-field-specs', () => {
  it('builds required fields first, then optional ones marked as optional', () => {
    const annulus = GEOMETRIES.find((geometry) => geometry.key === 'pipe_annulus')!;
    expect(toDimensionFieldSpecs(annulus)).toMatchInlineSnapshot(`
      [
        {
          "helperText": "Pipe / particle diameter, duct side, annulus inner diameter, rotating body radius",
          "key": "a",
          "label": "a",
          "max": undefined,
          "min": 0,
          "required": true,
          "unit": "m",
        },
        {
          "helperText": "Annulus outer diameter, duct / plate / cylinder height, outer radius",
          "key": "b",
          "label": "b",
          "max": undefined,
          "min": 0,
          "required": true,
          "unit": "m",
        },
        {
          "helperText": "Optional — Characteristic length override",
          "key": "L",
          "label": "L",
          "max": undefined,
          "min": 0,
          "required": false,
          "unit": "m",
        },
      ]
    `);
  });

  it('labels an unknown dimension with its key', () => {
    expect(toDimensionFieldSpecs({ key: 'new', description: '', requiredDims: ['zeta'] })).toEqual([
      { key: 'zeta', label: 'zeta', unit: undefined, min: undefined, max: undefined, helperText: undefined, required: true },
    ]);
  });
});
