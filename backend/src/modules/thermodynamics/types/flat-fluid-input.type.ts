import { KnownFluid } from './known-fluid.type';

/** Flat-format fluid descriptor shared by all scalar dimensionless endpoints. */
export type FlatFluidInput = {
  fluid?: KnownFluid;
  compoundId?: string;
  composition?: Record<string, number>;
  T_fluid_K?: number;
  P_Pa?: number;
};
