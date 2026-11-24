/**
 * Boundary-handling action for a thermophysical equation evaluation.
 *
 * Policy: warn-and-clamp for empirical equations; NASA H/S/G may extrapolate
 * with boundary Cp and report `action: 'extrapolated'`.
 */
export type ValidityAction = 'none' | 'clamped' | 'extrapolated';
