import type { PureGasPropertyRow } from '../../gases/types/pure-gas-property-row.type';
import type { OtherMaterialRequest } from './other-material-request.type';

export type OtherMaterialResultsProps = {
  request: OtherMaterialRequest;
  rows: PureGasPropertyRow[];
};
