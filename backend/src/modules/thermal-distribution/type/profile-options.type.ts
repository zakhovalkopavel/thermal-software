import type { BoundaryConditionKind } from './boundary-condition-kind.type';
import type { InitialProfileKind } from './initial-profile-kind.type';
import type { ShapeInput } from './shape-input.type';
import type { RDistMode } from './r-dist-mode.type';
import type { AverageOptions } from './average-options.type';
import type { ProductSolutionOptions } from './product-solution-options.type';

export type ProfileOptions = {
  // ── Boundary condition & transport ───────────────────────────────────────────
  bcType: BoundaryConditionKind;

  /** Ambient / quenching medium temperature (°C). */
  Tc: number;

  /** Initial uniform body temperature (°C). */
  T0: number;

  /** Time elapsed since process start (seconds). */
  tau: number;

  /** Heat transfer coefficient α (W/(m²·K)). Required for BC_III. */
  alpha?: number;

  /** Thermal conductivity λ̄ (W/(m·K)) — mean over [T0, Tc]. */
  lambda: number;

  /** Thermal diffusivity ā (m²/s) — mean over [T0, Tc]. */
  thermalDiffusivity: number;

  // ── Geometry ─────────────────────────────────────────────────────────────────
  shape: ShapeInput;
  rDistMode?: RDistMode; // default: 'true_dimension'

  // ── Initial profile (BC_III) ─────────────────────────────────────────────────
  initialProfile?: InitialProfileKind; // default: 'uniform'
  T0Ctr?: number;                      // parabolic: center temperature
  T0Surf?: number;                     // parabolic: surface temperature
  arbitraryProfileFn?: (x: number) => number; // arbitrary: f(x) callback

  // ── Product-rule configuration ───────────────────────────────────────────────
  productSolution?: ProductSolutionOptions;

  // ── Per-axis Biot for product-rule bodies ────────────────────────────────────
  /** BC_III parallelepiped: Biot per face pair [Bi1, Bi2, Bi3]. */
  biPerAxis?: [number, number, number];
  /** BC_III finite cylinder: [Bi_lateral, Bi_endface]. */
  biCylinder?: [number, number];

  // ── Solver precision ─────────────────────────────────────────────────────────
  seriesTerms?: number;         // Fourier terms N, default: 100
  rootFinderTol?: number;       // Eigenvalue convergence, default: 1e-12
  rootFinderMaxIter?: number;   // Newton iterations, default: 50

  // ── Volume average ───────────────────────────────────────────────────────────
  avg: AverageOptions;

  // ── Non-linear time stepping (oil quenching) ─────────────────────────────────
  /** Per-step α = f(Ts) override. Overrides `alpha` when provided. */
  alphaCurve?: (Ts: number) => number;
  /** Time step size for sequential interval method (seconds). */
  timeStep?: number;
};
