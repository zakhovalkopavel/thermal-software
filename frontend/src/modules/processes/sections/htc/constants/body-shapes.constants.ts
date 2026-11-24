import type { BodyShape } from '../types/body-shape.type';

/** Dimension meanings follow the formulas of the backend body-geometry helper (sphere / cylinder `a` is a radius there). */
export const BODY_SHAPES: BodyShape[] = [
  { value: 'sphere', label: 'Sphere', dims: [{ key: 'a', label: 'Radius a' }], usesInsulation: true },
  {
    value: 'cylinder',
    label: 'Cylinder',
    dims: [
      { key: 'a', label: 'Radius a' },
      { key: 'b', label: 'Height b' },
    ],
    usesInsulation: true,
  },
  { value: 'cube', label: 'Cube', dims: [{ key: 'a', label: 'Side a' }], usesInsulation: true },
  {
    value: 'rectangularPrism',
    label: 'Rectangular box',
    dims: [
      { key: 'a', label: 'Width a' },
      { key: 'b', label: 'Height b' },
      { key: 'c', label: 'Depth c' },
    ],
    usesInsulation: true,
  },
  {
    value: 'prism',
    label: 'Triangular prism',
    dims: [
      { key: 'a', label: 'Base edge a' },
      { key: 'b', label: 'Triangle height b' },
      { key: 'c', label: 'Length c' },
    ],
    usesInsulation: false,
  },
  {
    value: 'cone',
    label: 'Cone',
    dims: [
      { key: 'a', label: 'Base radius a' },
      { key: 'b', label: 'Height b' },
    ],
    usesInsulation: false,
  },
  {
    value: 'truncated_cone',
    label: 'Truncated cone',
    dims: [
      { key: 'a', label: 'Base radius a' },
      { key: 'b', label: 'Top radius b' },
      { key: 'c', label: 'Height c' },
    ],
    usesInsulation: false,
  },
  {
    value: 'hollow_cylinder',
    label: 'Hollow cylinder',
    dims: [
      { key: 'a', label: 'Inner radius a' },
      { key: 'b', label: 'Outer radius b' },
      { key: 'c', label: 'Height c' },
    ],
    usesInsulation: false,
  },
  {
    value: 'ellipsoid',
    label: 'Ellipsoid',
    dims: [
      { key: 'a', label: 'Semi-axis a' },
      { key: 'b', label: 'Semi-axis b' },
      { key: 'c', label: 'Semi-axis c' },
    ],
    usesInsulation: false,
  },
  { value: 'hemispherical_dome', label: 'Hemispherical dome', dims: [{ key: 'a', label: 'Radius a' }], usesInsulation: false },
];
