import type { GasListEntry } from '../../../types/gas-list-entry.type';
import type { PureGasPropertyRow } from './pure-gas-property-row.type';
import type { PureGasRequest } from './pure-gas-request.type';

export type PureGasResultsProps = {
  request: PureGasRequest;
  rows: PureGasPropertyRow[];
  gasList: GasListEntry[];
};
