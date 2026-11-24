import { CoolpropConductivityCriticalJson } from './coolprop-conductivity-critical-json.type';
import { CoolpropConductivityDiluteJson } from './coolprop-conductivity-dilute-json.type';
import { CoolpropConductivityResidualJson } from './coolprop-conductivity-residual-json.type';

/**
 * One CoolProp `TRANSPORT.conductivity` model entry (object form).
 * Top-level `hardcoded` means the whole model is C++-only.
 */
export type CoolpropConductivityBlockJson = {
  BibTeX?: string;
  note?: string;
  hardcoded?: string;
  dilute?: CoolpropConductivityDiluteJson;
  residual?: CoolpropConductivityResidualJson;
  critical?: CoolpropConductivityCriticalJson;
};
