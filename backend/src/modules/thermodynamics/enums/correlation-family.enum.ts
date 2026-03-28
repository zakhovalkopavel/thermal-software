/**
 * Logical family that a correlation belongs to.
 * Used by correlation-selector to route a CorrelationName to the correct
 * Nu-formula helper file without a giant if-else chain of raw strings.
 */
export enum CorrelationFamily {
  PipeDuct          = 'pipe_duct',
  FlatPlate         = 'flat_plate',
  Cylinder          = 'cylinder',
  Sphere            = 'sphere',
  TubeBank          = 'tube_bank',
  NaturalConvection = 'natural_convection',
  Special           = 'special',
}

