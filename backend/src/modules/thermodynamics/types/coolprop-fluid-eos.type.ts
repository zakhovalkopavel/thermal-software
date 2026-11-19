import { CoolpropAlpha0Term } from './coolprop-alpha0-term.type';
import { CoolpropAlpharTerm } from './coolprop-alphar-term.type';

/** Minimal CoolProp fluid EOS fields for Helmholtz density / transport. */
export type CoolpropFluidEos = {
  Tc: number;
  /** Reducing pressure [Pa] (critical for pure fluids). */
  Pc: number;
  rhoc: number;
  molarMass: number;
  alpha0: readonly CoolpropAlpha0Term[];
  alphar: readonly CoolpropAlpharTerm[];
};
