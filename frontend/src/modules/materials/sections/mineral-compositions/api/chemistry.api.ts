import { api } from '@/shared/api/client';
import type { MineralPhase } from '../types/mineral-phase.type';
import type { MineralPhaseInput } from '../types/mineral-phase-input.type';
import type { PhaseEquilibriumInput } from '../types/phase-equilibrium-input.type';
import type { PhaseEquilibriumResult } from '../types/phase-equilibrium-result.type';
import type { RefractorinessInput } from '../types/refractoriness-input.type';
import type { RefractorinessResult } from '../types/refractoriness-result.type';

export const chemistryApi = {
  phaseEquilibrium: async (input: PhaseEquilibriumInput): Promise<PhaseEquilibriumResult> =>
    (await api.post<PhaseEquilibriumResult>('/refractory/phase-equilibrium', input)).data,
  mineralPhases: async (input: MineralPhaseInput): Promise<MineralPhase[]> =>
    (await api.post<MineralPhase[]>('/refractory/mineral-phases', input)).data,
  refractoriness: async (input: RefractorinessInput): Promise<RefractorinessResult> =>
    (await api.post<RefractorinessResult>('/refractory/refractoriness', input)).data,
};
