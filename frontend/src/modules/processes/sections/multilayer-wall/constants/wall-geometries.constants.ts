import type { WallGeometry } from '../../../types/wall-geometry.type';

export const WALL_GEOMETRIES: ReadonlyArray<{ value: WallGeometry; label: string }> = [
  { value: 'flat', label: 'Flat' },
  { value: 'cylinder', label: 'Cylinder' },
  { value: 'sphere', label: 'Sphere' },
];
