import type { GasMixtureRequest } from './gas-mixture-request.type';
import type { GasMixtureRow } from './gas-mixture-row.type';

export type GasMixtureResultsProps = {
  request: GasMixtureRequest;
  rows: GasMixtureRow[];
};
