import type { MaterialEntry } from '../../../types/material-entry.type';
import type { CompleteMixFraction } from '../types/complete-mix-fraction.type';
import { toSizeLabel } from './size-label.mapper';

export function toFractionLabel(fraction: CompleteMixFraction, components: Map<string, MaterialEntry>): string {
  return `${components.get(fraction.materialId)?.name ?? fraction.materialId} ${toSizeLabel(fraction)}`;
}
