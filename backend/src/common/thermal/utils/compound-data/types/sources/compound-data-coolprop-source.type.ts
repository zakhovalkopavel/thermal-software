/** Where the CoolProp fluid names of `CompoundDataRecord.coolprop` resolve */
export type CompoundDataCoolpropSource = {
  ref: 'CoolProp';
  /** CoolProp fluids folder, e.g. `shared/sources/coolprop/fluids` */
  dataset: string;
  /** Paths read at build time (usually the same fluids folder) */
  sources: string[];
}
