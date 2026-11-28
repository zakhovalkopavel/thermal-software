import type { FluidPhase } from '../../../types/fluid-phase.type';

export type PrandtlInput = {
  fluid?: string;
  compoundId?: string;
  composition?: Record<string, number>;
  T_fluid_K: number;
  P_Pa?: number;
  phase?: FluidPhase;
};
