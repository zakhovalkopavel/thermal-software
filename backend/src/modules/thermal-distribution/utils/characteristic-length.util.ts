/**
 * Characteristic length computation for thermal-distribution solvers.
 *
 * Returns two radii:
 *   Rdist — profile scaling radius: used as R in cos(μ·x/R), J₀(μ·r/R), etc.
 *   Rbi   — Biot-number radius: used as R in Bi = α·R/λ.
 *
 * Rules per geometry (SPEC_01_Geometries.md §1):
 *   plate:            Rdist = halfThickness,        Rbi = V/S = halfThickness
 *   cylinder:         Rdist = radius,                Rbi = radius (same as Rdist)
 *   sphere:           Rdist = radius,                Rbi = radius (same as Rdist)
 *   hollow_cylinder:  Rdist = outerRadius (R₂),     Rbi computed from R₁,R₂ wall
 *   parallelepiped:   Rdist = largest half-dim,      Rbi per-axis (caller responsibility)
 *   finite_cylinder:  Rdist = radius,                Rbi = radius (same as Rdist)
 *   auto (V/A given): Rdist = V/A,                  Rbi = V/A
 *
 * Reference: THERMAL_DISTRIBUTION_SPEC_01_Geometries.md
 */
import type { ShapeInput } from '../type/shape-input.type';
import type { RDistMode } from '../type/r-dist-mode.type';

export type CharacteristicLengths = {
  Rdist: number; // profile scaling radius (m)
  Rbi: number;   // Biot-number radius (m)
};

/**
 * Compute Rdist and Rbi from a ShapeInput descriptor.
 *
 * @param shape   Geometry and dimensional parameters.
 * @param mode    'true_dimension' (default) or 'V_over_A'.
 */
export function computeCharacteristicLengths(
  shape: ShapeInput,
  mode: RDistMode = 'true_dimension',
): CharacteristicLengths {
  const { geometry } = shape;

  if (mode === 'V_over_A') {
    const rva = resolveVoverA(shape);
    return { Rdist: rva, Rbi: rva };
  }

  switch (geometry) {
    case 'plate': {
      const R = shape.halfThickness;
      if (!R || R <= 0) throw new Error('plate: halfThickness required');
      return { Rdist: R, Rbi: R }; // V/S = halfThickness for slab
    }
    case 'cylinder': {
      const R = shape.radius;
      if (!R || R <= 0) throw new Error('cylinder: radius required');
      return { Rdist: R, Rbi: R };
    }
    case 'sphere': {
      const R = shape.radius;
      if (!R || R <= 0) throw new Error('sphere: radius required');
      return { Rdist: R, Rbi: R };
    }
    case 'hollow_cylinder': {
      const R1 = shape.innerRadius;
      const R2 = shape.outerRadius;
      if (!R1 || !R2 || R1 <= 0 || R2 <= R1)
        throw new Error('hollow_cylinder: innerRadius < outerRadius required');
      // Rbi = (R2-R1)/2 — wall half-thickness
      return { Rdist: R2, Rbi: (R2 - R1) / 2 };
    }
    case 'parallelepiped': {
      const R1 = shape.halfX, R2 = shape.halfY, R3 = shape.halfZ;
      if (!R1 || !R2 || !R3 || R1 <= 0 || R2 <= 0 || R3 <= 0)
        throw new Error('parallelepiped: halfX, halfY, halfZ required');
      // Rdist = largest half-dimension; Rbi same (per-axis Bi handled by caller)
      const Rdist = Math.max(R1, R2, R3);
      return { Rdist, Rbi: Rdist };
    }
    case 'finite_cylinder': {
      const R = shape.radius;
      const l = shape.halfZ;
      if (!R || !l || R <= 0 || l <= 0)
        throw new Error('finite_cylinder: radius and halfZ required');
      return { Rdist: R, Rbi: R };
    }
    case 'auto': {
      const rva = resolveVoverA(shape);
      return { Rdist: rva, Rbi: rva };
    }
    default:
      throw new Error(`computeCharacteristicLengths: unknown geometry '${geometry}'`);
  }
}

function resolveVoverA(shape: ShapeInput): number {
  const { V, A } = shape;
  if (!V || !A || V <= 0 || A <= 0)
    throw new Error('V_over_A mode / auto geometry: V and A must be provided and positive');
  return V / A;
}
