/**
 * BC_I  — Dirichlet (1st kind): surface temperature = Tc instantaneously.
 *          Applies when Bi ≥ 100 (water / salt quenching).
 * BC_III — Convective (3rd kind): −λ·∂T/∂n = α·(T − Tc).
 *          Applies when 0.1 < Bi < 100 (furnace, air, oil quenching).
 */
export type BoundaryConditionKind = 'BC_I' | 'BC_III';
