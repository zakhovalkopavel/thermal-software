import type { Geometry } from './geometry.type';

export type ShapeInput = {
  geometry: Geometry;
  // 1D solvers
  halfThickness?: number; // plate: R = halfThickness
  radius?: number;        // cylinder / sphere: R
  innerRadius?: number;   // hollow cylinder: R1
  outerRadius?: number;   // hollow cylinder: R2
  // product-rule solvers
  halfX?: number;         // parallelepiped: R1
  halfY?: number;         // parallelepiped: R2
  halfZ?: number;         // parallelepiped: R3 (or finite cylinder axial half-length l)
  // complex bodies (Path A/B)
  V?: number;             // true volume (m³)
  A?: number;             // exposed surface area (m²)
};
