/** Cp/H/S/G evaluation shared by the NASA-7 and NASA-9 equation methods */
export interface NasaMethod<V> {
  calculate(T: number, vars: V, min: number, max: number): number;
  enthalpy(T: number, vars: V): number;
  entropy(T: number, vars: V): number;
  gibbsEnergy(T: number, vars: V): number;
}
