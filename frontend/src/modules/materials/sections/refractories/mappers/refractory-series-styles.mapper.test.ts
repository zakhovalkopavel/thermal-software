import { describe, expect, it } from 'vitest';
import { recordedResponse } from '../../../../../../tests/setup/recorded-response';
import type { RefractoryProductSummary } from '../../../types/refractory-product-summary.type';
import { toRefractorySeriesStyles } from './refractory-series-styles.mapper';

const PRODUCTS = recordedResponse<RefractoryProductSummary[]>('GET /refractory/refractories');

describe('refractories › refractory-series-styles', () => {
  it('colours selected products by group and brightens further products of the same group', () => {
    const chamotte = PRODUCTS.filter((product) => product.materialId.startsWith('chamotte_')).slice(0, 2);
    const ids = [...chamotte.map((product) => product.materialId), 'mullite_2300'];
    expect(toRefractorySeriesStyles(ids, PRODUCTS)).toMatchInlineSnapshot(`
      {
        "chamotte_1300": {
          "color": "rgb(239,146,106)",
          "name": "Chamotte 1300 kg/m³",
        },
        "chamotte_solid": {
          "color": "rgb(176,83,43)",
          "name": "Chamotte solid (dense fire brick)",
        },
        "mullite_2300": {
          "color": "rgb(123,31,162)",
          "name": "Mullite brick 2300 kg/m³",
        },
      }
    `);
  });

  it('ignores ids missing from the catalogue', () => {
    expect(toRefractorySeriesStyles(['not_in_catalogue'], PRODUCTS)).toEqual({});
  });
});
