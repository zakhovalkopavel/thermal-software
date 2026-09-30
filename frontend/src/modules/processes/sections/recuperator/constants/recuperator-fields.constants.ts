import type { NumberFieldSpec } from '../../../types/number-field-spec.type';
import type { RecuperatorFieldKey } from '../types/recuperator-field-key.type';

/** Limits follow RecuperatorInputDto. */
export const RECUPERATOR_FIELDS = {
  air: [{ key: 'tAirStart_K', label: 'Air inlet T', unit: 'K', min: 200, required: true }] satisfies NumberFieldSpec<RecuperatorFieldKey>[],
  geometry: [
    { key: 'd0_m', label: 'Channel size d₀', unit: 'm', min: 0.001, helperText: 'Diameter (circle) or side (square)', required: true },
    { key: 'refractoryThickness_m', label: 'Wall between channels', unit: 'm', min: 0.001, required: true },
    { key: 'nAir', label: 'Air channels', min: 1, required: true },
    { key: 'nSmoke', label: 'Smoke channels', min: 1, required: true },
    { key: 'wantedRecuperatorLength_m', label: 'Target length', unit: 'm', min: 0.1, required: true },
  ] satisfies NumberFieldSpec<RecuperatorFieldKey>[],
  ring: [
    { key: 'h0_m', label: 'Air gap depth h₀', unit: 'm', min: 0 },
    { key: 'nPasses', label: 'Air passes', min: 1, helperText: 'Default 1' },
  ] satisfies NumberFieldSpec<RecuperatorFieldKey>[],
  materials: [
    { key: 'refractoryLambda_WmK', label: 'Wall λ', unit: 'W/(m·K)', min: 0.01, required: true },
    { key: 'refractoryEmissivity', label: 'Wall ε', min: 0, max: 1, required: true },
    { key: 'thermalInsulationThickness_m', label: 'Insulation thickness', unit: 'm', min: 0, required: true },
    { key: 'surfaceEmissivity', label: 'Outer shell ε', min: 0, max: 1, required: true },
    { key: 'surfaceArea_m2', label: 'Outer surface area', unit: 'm²', min: 0, required: true },
  ] satisfies NumberFieldSpec<RecuperatorFieldKey>[],
  advanced: [
    { key: 'airPreheat_K', label: 'Air preheat offset', unit: 'K', helperText: 'Added to the combustion air T for the max flame T; default 0' },
  ] satisfies NumberFieldSpec<RecuperatorFieldKey>[],
};
