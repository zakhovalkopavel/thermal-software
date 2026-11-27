import type { AlgorithmMode } from '../types/algorithm-mode.type';
import type { LegacyVariant } from '../types/legacy-variant.type';

export const ALGORITHM_MODES: { value: AlgorithmMode; label: string }[] = [
  { value: 'calphad', label: 'CALPHAD' },
  { value: 'legacy', label: 'Legacy' },
  { value: 'compare', label: 'Compare (CALPHAD vs legacy)' },
];

export const LEGACY_VARIANTS: { value: LegacyVariant; label: string }[] = [
  { value: 'eutectic', label: 'Eutectic' },
  { value: 'diagram', label: 'Diagram (may be unavailable)' },
];
