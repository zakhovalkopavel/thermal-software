import type { DimensionSpec } from '../types/dimension-spec.type';

/** Labels of the GeometryDimsDto fields; which ones a geometry needs comes from GET /thermodynamics/geometry/list. */
export const GEOMETRY_DIMENSIONS: Record<string, DimensionSpec> = {
  a: { label: 'a', unit: 'm', min: 0, helperText: 'Pipe / particle diameter, duct side, annulus inner diameter, rotating body radius' },
  b: { label: 'b', unit: 'm', min: 0, helperText: 'Annulus outer diameter, duct / plate / cylinder height, outer radius' },
  c: { label: 'c', unit: 'm', min: 0, helperText: 'Flat-plate streamwise length, third side of the duct' },
  L: { label: 'L', unit: 'm', min: 0, helperText: 'Characteristic length override' },
  epsilon: { label: 'ε', min: 0, max: 1, helperText: 'Bed void fraction' },
  S_T: { label: 'S_T', unit: 'm', min: 0, helperText: 'Transverse tube pitch' },
  S_L: { label: 'S_L', unit: 'm', min: 0, helperText: 'Longitudinal tube pitch' },
  angle_deg: { label: 'Angle', unit: '°', helperText: 'From vertical; default 0' },
  omega: { label: 'ω', unit: 'rad/s', min: 0, helperText: 'Angular velocity' },
  D: { label: 'D', unit: 'm', min: 0, helperText: 'Tube diameter in the coil' },
  D_c: { label: 'D_c', unit: 'm', min: 0, helperText: 'Coil centreline diameter' },
  e: { label: 'e', unit: 'm', min: 0, helperText: 'Rib height' },
  p: { label: 'p', unit: 'm', min: 0, helperText: 'Rib pitch' },
  H: { label: 'H', unit: 'm', min: 0, helperText: 'Jet-to-surface spacing' },
  r: { label: 'r', unit: 'm', min: 0, helperText: 'Radial distance from the jet axis' },
  d_jet: { label: 'd_jet', unit: 'm', min: 0, helperText: 'Nozzle diameter' },
  f_jet: { label: 'f_jet', min: 0, max: 1, helperText: 'Jet area fraction' },
};
