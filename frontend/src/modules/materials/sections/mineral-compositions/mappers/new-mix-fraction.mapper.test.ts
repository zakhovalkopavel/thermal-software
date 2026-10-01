import { describe, expect, it } from 'vitest';
import { toNewMixFraction } from './new-mix-fraction.mapper';

describe('mineral-compositions › new-mix-fraction', () => {
  it('creates an empty, unfixed row with a unique id', () => {
    const first = toNewMixFraction();
    const second = toNewMixFraction();
    expect(first).toMatchObject({
      materialId: null,
      sizeKey: null,
      dMin_mm: null,
      dMax_mm: null,
      d50_mm: null,
      massPercent: null,
      density_kgm3: null,
      isFixed: false,
    });
    expect(first.id).toMatch(/^fraction-\d+$/);
    expect(second.id).not.toBe(first.id);
  });
});
