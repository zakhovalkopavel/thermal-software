import { CompoundDataTransportValue } from './compound-data-transport-value.type';

/** `CompoundDataRecord.transport`: pure-species rows of Svehla 1995 Table I */
export type CompoundDataTransport = {
  viscosity?: CompoundDataTransportValue[];
  thermalConductivity?: CompoundDataTransportValue[];
}
