import type { NumberFieldSpec } from '../../../types/number-field-spec.type';
import type { HtcFieldKey } from '../types/htc-field-key.type';

/** Limits follow DimensionlessInputDto. */
export const HTC_FIELDS = {
  main: [
    { key: 'T_fluid_K', label: 'Fluid temperature', unit: 'K', min: 1, required: true },
    { key: 'T_surface_K', label: 'Surface temperature', unit: 'K', min: 1, helperText: 'Needed for Gr and Ra' },
    { key: 'w_m_s', label: 'Velocity', unit: 'm/s', min: 0, helperText: '0 = natural convection' },
  ] satisfies NumberFieldSpec<HtcFieldKey>[],
  advanced: [
    { key: 'P_Pa', label: 'Pressure', unit: 'Pa', min: 1, helperText: 'Default 101325 Pa' },
    { key: 'g_m_s2', label: 'Gravity', unit: 'm/s²', min: 0, helperText: 'Default 9.80665 m/s²' },
  ] satisfies NumberFieldSpec<HtcFieldKey>[],
};
