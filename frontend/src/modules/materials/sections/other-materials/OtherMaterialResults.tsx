import { PureGasResults } from '../gases/PureGasResults';
import type { PureGasRequest } from '../gases/types/pure-gas-request.type';
import type { OtherMaterialResultsProps } from './types/other-material-results-props.type';

export function OtherMaterialResults({ request, rows }: OtherMaterialResultsProps) {
  const gasRequest: PureGasRequest = {
    mode: request.mode,
    gases: [request.compound],
    temperatures_K: request.temperatures_K,
    P_Pa: request.P_Pa,
  };

  return <PureGasResults request={gasRequest} rows={rows} gasList={[]} temperatureUnit={request.unit} />;
}
