import { CoolpropConductivityJson } from './coolprop-conductivity-json.type';

/**
 * Minimal CoolProp fluid JSON slice used when loading TRANSPORT.conductivity.
 * Full fluid EOS fields are handled by `CoolpropHelmholtzData`.
 */
export type CoolpropFluidTransportJson = {
  TRANSPORT?: {
    conductivity?: CoolpropConductivityJson;
    viscosity?: unknown;
  };
};
