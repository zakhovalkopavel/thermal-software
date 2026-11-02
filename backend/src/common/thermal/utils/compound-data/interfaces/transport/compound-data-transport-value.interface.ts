import { CompoundDataRef } from '../property/compound-data-ref.type';
import { CompoundDataTransportMethod } from './compound-data-transport-method.interface';

/** How the NASA Lewis transport fit of one property was obtained (Svehla 1995 Table I, one row) */
export interface CompoundDataTransportValue {
  methods: CompoundDataTransportMethod[];
  /** High- and low-temperature data forced to agree here [K] */
  matchTemperatureK?: number;
  ref: CompoundDataRef;
}
