/**
 * Glass Viscosity Validation Dataset — barrel re-export
 *
 * Individual datasets live in dedicated files:
 *   lakatos-validation.data.ts      — Lakatos 1976 (all series S, D, F₂, FAL)
 *   fluegel-validation.data.ts      — Fluegel 2007 (NIST standards + CO glass)
 *   hetherington-validation.data.ts — Hetherington 1964 (pure fused silica)
 */

export type { GlassIsokomPoint, GlassValidationEntry } from './interfaces/glass-viscosity-validation.interface';
export { LAKATOS_VALIDATION_GLASSES }      from './lakatos-validation.data';
export { FLUEGEL_VALIDATION_GLASSES }      from './fluegel-validation.data';
export { HETHERINGTON_VALIDATION_GLASSES } from './hetherington-validation.data';
