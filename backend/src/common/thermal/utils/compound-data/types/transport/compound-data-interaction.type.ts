import { CompoundDataRef } from '../../types/property/compound-data-ref.type';
import { CompoundDataTransportMethod } from './compound-data-transport-method.type';

/** One species pair of Svehla 1995 Table I that is not a pure-species viscosity or conductivity row */
export type CompoundDataInteraction = {
  /** Pair as printed, e.g. ["CH4", "O2"], ["e", "N2"] (e = electron, + = cation) */
  species: [string, string];
  /** Record id of each species; `null` without a record (electron, ions, H6F6) */
  ids: [string | null, string | null];
  /** CAS of each species; `null` for the electron, ions and H6F6 */
  cas: [string | null, string | null];
  property: 'viscosity' | 'thermalConductivity' | 'diffusion';
  methods: CompoundDataTransportMethod[];
  /** High- and low-temperature data forced to agree here [K] */
  matchTemperatureK?: number;
  ref: CompoundDataRef;
}
