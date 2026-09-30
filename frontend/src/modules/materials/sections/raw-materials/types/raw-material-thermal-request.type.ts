export type RawMaterialThermalRequest = {
  /** First entry is the selected material; the rest are compared materials. */
  materialIds: string[];
  temperatures_C: number[];
  porosity: number;
  /** Adds a P = 0 series for the first material. */
  includeDense: boolean;
};
