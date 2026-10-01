import { ApiProperty } from '@nestjs/swagger';
import { MetalMaterial } from '../enums/metal-material.enum';

export class MetalThermalResultDto {
  @ApiProperty({ enum: MetalMaterial }) material: MetalMaterial;
  @ApiProperty() T_K: number;
  @ApiProperty() lambda_WmK: number;
  @ApiProperty() emissivity: number;
}
