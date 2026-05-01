import { FlowGeometry } from '../enums/flow-geometry.enum';
import { CorrelationName } from '../enums/correlation-name.enum';

/** One entry returned by GET /thermodynamics/fluid/flow-modes */
export interface FlowModeEntry {
  key: string;
  description: string;
}

/** One entry returned by GET /thermodynamics/fluid/list */
export interface FluidListEntry {
  key: string;
  name: string;
  formula: string | null;
  Mr_kg_mol: number | null;
}

/** One entry returned by GET /thermodynamics/geometry/list */
export interface GeometryListEntry {
  key: string;
  description: string;
  requiredDims: string[];
  optionalDims?: string[];
}

/** One entry returned by GET /thermodynamics/correlations */
export interface CorrelationListEntry {
  name: CorrelationName;
  geometry: FlowGeometry[];
  /** Validity range [Re_min, Re_max]. Re_max is "Infinity" when there is no upper bound. */
  Re?: [number, number | string];
  /** Validity range [Pr_min, Pr_max]. Pr_max is "Infinity" when there is no upper bound. */
  Pr?: [number, number | string];
  /** Validity range [Ra_min, Ra_max]. Ra_max is "Infinity" when there is no upper bound. */
  Ra?: [number, number | string];
}


