/** One entry returned by GET /thermodynamics/geometry/list */
export type GeometryListEntry = {
  key: string;
  description: string;
  requiredDims: string[];
  optionalDims?: string[];
};
