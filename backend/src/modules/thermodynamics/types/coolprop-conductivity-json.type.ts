import { CoolpropConductivityBlockJson } from './coolprop-conductivity-block-json.type';

/**
 * CoolProp `TRANSPORT.conductivity` wire value: one model or a list of models
 * (e.g. Nitrogen has expression + coefficient forms).
 */
export type CoolpropConductivityJson =
  | CoolpropConductivityBlockJson
  | CoolpropConductivityBlockJson[];
