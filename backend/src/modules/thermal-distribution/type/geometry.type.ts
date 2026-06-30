export type Geometry =
  | 'plate'           // Infinite Plate (thickness 2R)
  | 'cylinder'        // Infinite Cylinder (radius R)
  | 'sphere'          // Solid Sphere (radius R)
  | 'hollow_cylinder' // Hollow Cylinder (R1 ≤ r ≤ R2)
  | 'parallelepiped'  // Finite Parallelepiped (2R1 × 2R2 × 2R3), product rule
  | 'finite_cylinder' // Finite Cylinder (radius R, half-length l), product rule
  | 'auto';           // Automated topology classification (HC-16)
