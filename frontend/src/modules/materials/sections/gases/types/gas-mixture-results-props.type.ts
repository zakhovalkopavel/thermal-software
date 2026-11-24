import type { GasMixtureRequest } from './gas-mixture-request.type';
import type { GasMixtureRow } from './gas-mixture-row.type';

export type GasMixtureResultsProps = {
  request: GasMixtureRequest;
  rows: GasMixtureRow[];
  /** Live form unit — plot/table T axis follows this without recalculating. */
  temperatureUnit: 'C' | 'K';
};
