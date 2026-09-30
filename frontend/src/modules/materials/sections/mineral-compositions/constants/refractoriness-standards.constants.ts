import type { RefractorinessStandard } from '../types/refractoriness-standard.type';

export const REFRACTORINESS_STANDARDS: { value: RefractorinessStandard; label: string }[] = [
  { value: 'ISO1893', label: 'ISO 1893 (RUL)' },
  { value: 'ASTM_C24', label: 'ASTM C24 (PCE)' },
  { value: 'ASTM_C71', label: 'ASTM C71' },
  { value: 'GOST4069', label: 'GOST 4069' },
];
