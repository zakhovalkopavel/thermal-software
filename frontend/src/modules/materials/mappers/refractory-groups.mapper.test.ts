import { describe, expect, it } from 'vitest';
import { recordedResponse } from '../../../../tests/setup/recorded-response';
import type { RefractoryProductSummary } from '../types/refractory-product-summary.type';
import { toRefractoryGroups } from './refractory-groups.mapper';

const PRODUCTS = recordedResponse<RefractoryProductSummary[]>('GET /refractory/refractories');

describe('materials › refractory-groups', () => {
  it('groups the recorded catalogue by id prefix and drops empty groups', () => {
    const groups = toRefractoryGroups(PRODUCTS);
    expect(groups.map((group) => [group.key, group.products.length])).toMatchInlineSnapshot(`
      [
        [
          "chamotte",
          6,
        ],
        [
          "mullite",
          1,
        ],
        [
          "quartz",
          5,
        ],
        [
          "alumina",
          5,
        ],
        [
          "carbide",
          1,
        ],
        [
          "insulation",
          1,
        ],
      ]
    `);
    expect(groups.flatMap((group) => group.products)).toHaveLength(PRODUCTS.length);
  });

  it('puts a product without a known prefix into Other', () => {
    const unknown = { ...PRODUCTS[0], materialId: 'new_backend_product' };
    const groups = toRefractoryGroups([unknown]);
    expect(groups).toHaveLength(1);
    expect(groups[0].key).toBe('other');
  });
});
