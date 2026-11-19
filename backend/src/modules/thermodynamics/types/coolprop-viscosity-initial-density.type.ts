/** CoolProp initial-density viscosity contribution (Rainwater–Friend B_η). */
export type CoolpropViscosityInitialDensity = {
  type: 'Rainwater-Friend';
  b: number[];
  t: number[];
};
