import { api } from '../../../services/api/client';
import type { BedCombustionInput } from '../types/bed-combustion-input.type';
import type { BedCombustionResult } from '../types/bed-combustion-result.type';
import type { FluidFuelInput } from '../types/fluid-fuel-input.type';
import type { FuelSummary } from '../types/fuel-summary.type';
import type { SingleStepCombustionResult } from '../types/single-step-combustion-result.type';
import type { SolidDirectInput } from '../types/solid-direct-input.type';
import type { SolidTwoStepInput } from '../types/solid-two-step-input.type';
import type { SolidTwoStepResult } from '../types/solid-two-step-result.type';

export const combustionApi = {
  fuels: async (): Promise<FuelSummary[]> => (await api.get<FuelSummary[]>('/combustion/fuels')).data,
  solidDirect: async (input: SolidDirectInput): Promise<SingleStepCombustionResult> =>
    (await api.post<SingleStepCombustionResult>('/combustion/solid/direct', input)).data,
  solidTwoStep: async (input: SolidTwoStepInput): Promise<SolidTwoStepResult> =>
    (await api.post<SolidTwoStepResult>('/combustion/solid/two-step', input)).data,
  fluid: async (input: FluidFuelInput): Promise<SingleStepCombustionResult> =>
    (await api.post<SingleStepCombustionResult>('/combustion/fluid', input)).data,
  bed: async (input: BedCombustionInput): Promise<BedCombustionResult> =>
    (await api.post<BedCombustionResult>('/combustion/bed', input)).data,
};
