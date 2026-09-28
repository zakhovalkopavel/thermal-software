import { ApiProperty } from '@nestjs/swagger';
import { RefractoryThermalMaterial } from '../enums/refractory-thermal-material.enum';

export class RefractoryProductResultDto {
  @ApiProperty({ enum: RefractoryThermalMaterial })
  material: RefractoryThermalMaterial;

  @ApiProperty({ description: 'Temperature [K]' })
  T_K: number;

  @ApiProperty({ description: 'Thermal conductivity λ [W/(m·K)]' })
  lambda_WmK: number;

  @ApiProperty({ description: 'Emissivity ε [−], clamped to the validity range' })
  emissivity: number;
}
