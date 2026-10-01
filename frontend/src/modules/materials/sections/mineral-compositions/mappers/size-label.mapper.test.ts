import { describe, expect, it } from 'vitest';
import { toSizeLabel } from './size-label.mapper';

describe('mineral-compositions › size-label', () => {
  it('formats the size range in mm', () => {
    expect(toSizeLabel({ dMin_mm: 3, dMax_mm: 6 })).toMatchInlineSnapshot(`"3–6 mm"`);
    expect(toSizeLabel({ dMin_mm: 0.0005, dMax_mm: 0.005 })).toMatchInlineSnapshot(`"5.000·10⁻⁴–0.005 mm"`);
  });
});
