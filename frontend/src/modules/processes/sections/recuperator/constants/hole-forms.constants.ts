import type { HoleForm } from '../types/hole-form.type';

export const HOLE_FORMS: ReadonlyArray<{ value: HoleForm; label: string }> = [
  { value: 'circle', label: 'Circular channels' },
  { value: 'square', label: 'Square channels' },
  { value: 'triangle', label: 'Triangular channels' },
  { value: 'circle_in_ring', label: 'Circle in ring (annular air gap)' },
];
