/** Pure-fluid inputs for Peng–Robinson density. */
export type PengRobinsonFluidParams = {
  /** Molar mass [kg/mol] */
  Mr: number;
  /** Critical temperature [K] */
  Tc: number;
  /** Critical pressure [Pa] */
  Pc: number;
  /** Acentric factor [-] */
  omega: number;
};
