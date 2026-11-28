import { FluidPhase } from '../enums/fluid-phase.enum';
import { KnownFluid } from './known-fluid.type';

/** Flat-format fluid descriptor shared by all scalar dimensionless endpoints. */
export type FlatFluidInput = {
  fluid?: KnownFluid;
  compoundId?: string;
  composition?: Record<string, number>;
  T_fluid_K?: number;
  P_Pa?: number;
  /** Default gas. Liquid resolves catalogue liquid transport (μ, λ, ρ, Cp). */
  phase?: FluidPhase;
};
