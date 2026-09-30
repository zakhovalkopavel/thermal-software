export type PrandtlInput = {
  fluid?: string;
  composition?: Record<string, number>;
  T_fluid_K: number;
  P_Pa?: number;
};
