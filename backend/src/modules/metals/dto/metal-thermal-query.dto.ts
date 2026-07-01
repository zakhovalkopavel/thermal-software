import { IsEnum, IsNumber, Min } from 'class-validator';
import { MetalMaterial } from '../enums/metal-material.enum';

export class MetalThermalQueryDto {
  @IsEnum(MetalMaterial)
  material: MetalMaterial;

  @IsNumber() @Min(1)
  T_K: number;
}
