import type { MaterialEntry } from '../../../types/material-entry.type';
import { MINERAL_COMPOSITIONS_UI } from '../constants/mineral-compositions-ui.constants';
import type { MixFraction } from '../types/mix-fraction.type';

export type BinderSizePatch = Pick<MixFraction, 'sizeKey' | 'dMin_mm' | 'dMax_mm' | 'd50_mm'>;

/** Size fields for a binder mix component, or `null` when the material is not a binder. */
export function toBinderSizePatch(entry: MaterialEntry | undefined): BinderSizePatch | null {
  if (!entry || entry.materialGroup[0] !== MINERAL_COMPOSITIONS_UI.binderGroup) return null;
  const size = entry.particleSize;
  return {
    sizeKey: MINERAL_COMPOSITIONS_UI.materialSizeKey,
    dMin_mm: size?.dMin_mm ?? null,
    dMax_mm: size?.dMax_mm ?? null,
    d50_mm: size?.d50_mm ?? null,
  };
}
