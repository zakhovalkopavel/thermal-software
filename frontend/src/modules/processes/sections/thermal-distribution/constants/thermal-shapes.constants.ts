import type { ThermalShape } from '../types/thermal-shape.type';

const REQUIRED_LENGTH = { unit: 'm', min: 0, required: true } as const;

export const THERMAL_SHAPES: ThermalShape[] = [
  { value: 'cylinder', label: 'Infinite cylinder', fields: [{ key: 'radius', label: 'Radius', ...REQUIRED_LENGTH }] },
  { value: 'sphere', label: 'Sphere', fields: [{ key: 'radius', label: 'Radius', ...REQUIRED_LENGTH }] },
  {
    value: 'hollow_cylinder',
    label: 'Hollow cylinder',
    fields: [
      { key: 'innerRadius', label: 'Inner radius', ...REQUIRED_LENGTH },
      { key: 'outerRadius', label: 'Outer radius', ...REQUIRED_LENGTH },
    ],
  },
  {
    value: 'parallelepiped',
    label: 'Parallelepiped',
    fields: [
      { key: 'halfX', label: 'Half-length x₁', ...REQUIRED_LENGTH },
      { key: 'halfY', label: 'Half-length x₂', ...REQUIRED_LENGTH },
      { key: 'halfZ', label: 'Half-length x₃', ...REQUIRED_LENGTH },
    ],
  },
  {
    value: 'finite_cylinder',
    label: 'Finite cylinder',
    fields: [
      { key: 'radius', label: 'Radius', ...REQUIRED_LENGTH },
      { key: 'halfZ', label: 'Half-height', ...REQUIRED_LENGTH },
    ],
  },
];
