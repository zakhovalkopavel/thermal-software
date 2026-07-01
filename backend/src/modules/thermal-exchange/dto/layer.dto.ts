import { IsString, IsNumber, Min } from 'class-validator';
import { RefractoryThermalMaterial } from '../../refractory/enums/refractory-thermal-material.enum';
import { MetalMaterial } from '../../metals/enums/metal-material.enum';

export type WallMaterialKey = RefractoryThermalMaterial | MetalMaterial;

export class LayerDto {
  /** Material key — any RefractoryThermalMaterial or MetalMaterial value */
  @IsString()
  material: WallMaterialKey;

  /** Layer thickness [mm] */
  @IsNumber() @Min(0.1)
  thicknessMm: number;
}
