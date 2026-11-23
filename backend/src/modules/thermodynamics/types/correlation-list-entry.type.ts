import { FlowGeometry } from '../enums/flow-geometry.enum';
import { CorrelationName } from '../enums/correlation-name.enum';

/** One entry returned by GET /thermodynamics/correlations */
export type CorrelationListEntry = {
  name: CorrelationName;
  geometry: FlowGeometry[];
  /** Validity range [Re_min, Re_max]. Re_max is "Infinity" when there is no upper bound. */
  Re?: [number, number | string];
  /** Validity range [Pr_min, Pr_max]. Pr_max is "Infinity" when there is no upper bound. */
  Pr?: [number, number | string];
  /** Validity range [Ra_min, Ra_max]. Ra_max is "Infinity" when there is no upper bound. */
  Ra?: [number, number | string];
};
