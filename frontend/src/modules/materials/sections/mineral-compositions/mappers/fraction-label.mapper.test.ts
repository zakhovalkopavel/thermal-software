import { describe, expect, it } from 'vitest';
import { CASTABLE_MIX_FRACTIONS } from '../../../../../../tests/fixtures/inputs/castable-mix-fractions';
import { recordedResponse } from '../../../../../../tests/setup/recorded-response';
import type { MaterialCategory } from '../../../types/material-category.type';
import type { MaterialEntry } from '../../../types/material-entry.type';
import { toFractionLabel } from './fraction-label.mapper';

const COMPONENTS = new Map<string, MaterialEntry>(
  recordedResponse<MaterialCategory[]>('GET /refractory/mix-components')
    .flatMap((category) => category.materials)
    .map((material) => [material.materialId, material]),
);

describe('mineral-compositions › fraction-label', () => {
  it('names the component and its size range', () => {
    expect(toFractionLabel(CASTABLE_MIX_FRACTIONS[0], COMPONENTS)).toMatchInlineSnapshot(`"Tabular Alumina 3–6 mm"`);
  });

  it('falls back to the id for an unknown component', () => {
    expect(toFractionLabel({ ...CASTABLE_MIX_FRACTIONS[0], materialId: 'new_aggregate' }, COMPONENTS)).toMatch(/^new_aggregate /);
  });
});
