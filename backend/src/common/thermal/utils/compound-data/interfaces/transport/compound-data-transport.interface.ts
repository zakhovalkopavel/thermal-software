import { CompoundDataTransportValue } from './compound-data-transport-value.interface';

/** `CompoundDataRecord.transport`: pure-species rows of Svehla 1995 Table I */
export interface CompoundDataTransport {
  viscosity?: CompoundDataTransportValue[];
  thermalConductivity?: CompoundDataTransportValue[];
}
