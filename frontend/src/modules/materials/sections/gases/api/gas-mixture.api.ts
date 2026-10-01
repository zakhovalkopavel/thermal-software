import { api } from '@/shared/api/client';
import type { GasMixtureInput } from '../types/gas-mixture-input.type';
import type { GasPropertiesResult } from '../types/gas-properties-result.type';

export const gasMixtureApi = {
  getProperties: async (input: GasMixtureInput): Promise<GasPropertiesResult> =>
    (await api.post<GasPropertiesResult>('/thermodynamics/properties', input)).data,
};
