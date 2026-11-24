/** Origin of the reference solid conductivity of a raw material */
export enum ThermalReferenceSource {
  /** `thermalProperties.thermalConductivity_WmK` of the material */
  LIBRARY = 'library',
  /** Median of the mix components of the same primary group that have a library value */
  GROUP_MEDIAN = 'group-median',
}
