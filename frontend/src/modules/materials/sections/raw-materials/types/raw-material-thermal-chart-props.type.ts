import type { RawMaterialThermalPoint } from './raw-material-thermal-point.type';

export type RawMaterialThermalChartProps = {
  points: RawMaterialThermalPoint[];
  names: Record<string, string>;
  porosity: number;
  includeDense: boolean;
};
