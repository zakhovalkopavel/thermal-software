import { api } from '../../../../../services/api/client';
import type { GlassProfileInput } from '../types/glass-profile-input.type';
import type { GlassProfileResult } from '../types/glass-profile-result.type';
import type { GlassTemperatureAtViscosityInput } from '../types/glass-temperature-at-viscosity-input.type';
import type { GlassTemperatureAtViscosityResult } from '../types/glass-temperature-at-viscosity-result.type';
import type { GlassViscosityInput } from '../types/glass-viscosity-input.type';
import type { GlassViscosityResult } from '../types/glass-viscosity-result.type';

export const glassViscosityApi = {
  viscosity: async (input: GlassViscosityInput): Promise<GlassViscosityResult> =>
    (await api.post<GlassViscosityResult>('/refractory/glass-viscosity', input)).data,
  profile: async (input: GlassProfileInput): Promise<GlassProfileResult> =>
    (await api.post<GlassProfileResult>('/refractory/glass-viscosity/profile', input)).data,
  temperatureAtViscosity: async (input: GlassTemperatureAtViscosityInput): Promise<GlassTemperatureAtViscosityResult> =>
    (await api.post<GlassTemperatureAtViscosityResult>('/refractory/glass-viscosity/temperature-at-viscosity', input)).data,
};
