export enum CombustionMode {
  /** Solid fuel, one step: fuel + air → products */
  SolidDirect  = 'solid-direct',
  /** Solid fuel, generator (C → CO) + secondary-air burnout */
  SolidTwoStep = 'solid-two-step',
  /** Liquid or gaseous fuel, one step */
  Fluid        = 'fluid',
  /** Packed bed by layers (chemical kinetics) + secondary-air burnout */
  Bed          = 'bed',
}
