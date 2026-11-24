import type { MaterialEntryDto } from '../dto/material-catalog/material-entry.dto';
import type { ConductionLaw } from '../enums/conduction-law.enum';
import type { ThermalReferenceSource } from '../enums/thermal-reference-source.enum';

/** Per-material basis used while assembling mix thermal properties. */
export type MaterialBasis = {
  material: MaterialEntryDto;
  firedMassFraction: number;
  volumeFraction: number;
  phases_wt: Record<string, number>;
  lambdaReference_WmK: number;
  lambdaReferenceSource: ThermalReferenceSource;
  conductionLaw: ConductionLaw;
  /** Library Cp used for the phases without NASA-9 data; undefined → covered phases rescaled */
  specificHeatReference_JkgK?: number;
  heatCapacityCoverage_wt: number;
};
