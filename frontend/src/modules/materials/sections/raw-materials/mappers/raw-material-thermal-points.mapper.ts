import type { MixThermalResult } from '../../../types/mix-thermal-result.type';
import type { RawMaterialThermalPoint } from '../types/raw-material-thermal-point.type';

export function toRawMaterialThermalPoints(materialId: string, result: MixThermalResult): RawMaterialThermalPoint[] {
  return result.points.map((point) => ({
    materialId,
    temperature_C: point.temperature_C,
    porosity: result.porosity,
    lambda_WmK: point.lambdaEffective_WmK,
    cp_JkgK: point.specificHeat_JkgK,
    rho_kgm3: result.bulkDensity_kgm3,
    diffusivity_m2s: point.thermalDiffusivity_m2s,
  }));
}
