import type { MixFraction } from '../types/mix-fraction.type';

let lastId = 0;

export function toNewMixFraction(): MixFraction {
  lastId += 1;
  return {
    id: `fraction-${lastId}`,
    materialId: null,
    sizeKey: null,
    dMin_mm: null,
    dMax_mm: null,
    d50_mm: null,
    massPercent: null,
    density_kgm3: null,
    isFixed: false,
  };
}
