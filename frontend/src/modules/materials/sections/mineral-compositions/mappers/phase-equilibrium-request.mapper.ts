import type { ChemicalRequest } from '../types/chemical-request.type';
import type { PhaseEquilibriumInput } from '../types/phase-equilibrium-input.type';

/** Phase-equilibrium request at one temperature; always CALPHAD (legacy algorithm UI removed). */
export function toPhaseEquilibriumInput(request: ChemicalRequest | null, temperature: number): PhaseEquilibriumInput {
  return {
    fractions: request?.fractions ?? [],
    temperature,
    holdTime_hours: request?.holdTime_hours,
    totalMass: request?.totalMass,
    algorithmMode: 'calphad',
  };
}
