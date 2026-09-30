import type { BcType } from '../types/bc-type.type';
import type { InitialProfile } from '../types/initial-profile.type';
import type { ThermalTabKey } from '../types/thermal-tab-key.type';

const BC_TYPES: ReadonlyArray<{ value: BcType; label: string }> = [
  { value: 'BC_III', label: 'BC III — convective (α)' },
  { value: 'BC_I', label: 'BC I — prescribed surface temperature' },
];

const INITIAL_PROFILES: ReadonlyArray<{ value: InitialProfile; label: string }> = [
  { value: 'uniform', label: 'Uniform T₀' },
  { value: 'parabolic', label: 'Parabolic (centre → surface)' },
];

const TABS: ReadonlyArray<{ value: ThermalTabKey; label: string }> = [
  { value: 'criteria', label: 'Criteria' },
  { value: 'at-depth', label: 'At depth' },
  { value: 'profile', label: 'Profile' },
  { value: 'average', label: 'Average' },
];

export const THERMAL_OPTIONS = { bcTypes: BC_TYPES, initialProfiles: INITIAL_PROFILES, tabs: TABS };
