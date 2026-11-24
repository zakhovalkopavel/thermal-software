import type { MaterialEntry } from '../../../types/material-entry.type';
import { REFERENCE_PROPERTY_FIELDS } from '../constants/reference-property-fields.constants';
import type { ReferencePropertyRow } from '../types/reference-property-row.type';

export function toReferencePropertyRows(entry: MaterialEntry): ReferencePropertyRow[] {
  return REFERENCE_PROPERTY_FIELDS.flatMap(({ read, ...field }) => {
    const value = read(entry);
    return value === undefined || value === null ? [] : [{ ...field, value }];
  });
}
