import { CoolpropConductivityCritical } from './coolprop-conductivity-critical.type';
import { CoolpropConductivityDilute } from './coolprop-conductivity-dilute.type';
import { CoolpropConductivityResidual } from './coolprop-conductivity-residual.type';

/** Parsed CoolProp pure-fluid conductivity model (dilute / residual / critical). */
export type CoolpropConductivityModel = {
  dilute?: CoolpropConductivityDilute;
  residual?: CoolpropConductivityResidual;
  critical?: CoolpropConductivityCritical;
};
