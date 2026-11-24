export type FluidBaseInput = {
  fluid?: string;
  compoundId?: string;
  composition?: Record<string, number>;
  T_fluid_K: number;
  P_Pa?: number;
  fractionType?: 'mole' | 'mass';
};
