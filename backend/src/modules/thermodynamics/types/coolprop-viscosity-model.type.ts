import { CoolpropViscosityDilute } from './coolprop-viscosity-dilute.type';
import { CoolpropViscosityHigherOrder } from './coolprop-viscosity-higher-order.type';
import { CoolpropViscosityInitialDensity } from './coolprop-viscosity-initial-density.type';

/** Parsed CoolProp TRANSPORT.viscosity model we can evaluate. */
export type CoolpropViscosityModel = {
  dilute: CoolpropViscosityDilute;
  epsilon_over_k: number;
  sigma_eta_m: number;
  initialDensity?: CoolpropViscosityInitialDensity;
  higherOrder?: CoolpropViscosityHigherOrder;
};
