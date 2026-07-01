import { MetalMaterial } from '../enums/metal-material.enum';

export class MetalThermalResultDto {
  material: MetalMaterial;
  T_K: number;
  lambda_WmK: number;
  emissivity: number;
}
