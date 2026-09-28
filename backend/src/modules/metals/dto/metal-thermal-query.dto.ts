import { IsEnum, IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { MetalMaterial } from '../enums/metal-material.enum';

export class MetalThermalQueryDto {
  @ApiProperty({ enum: MetalMaterial, description: 'Metal material identifier', example: MetalMaterial.AISI_304 })
  @IsEnum(MetalMaterial)
  material: MetalMaterial;

  @ApiProperty({ description: 'Temperature [K]', example: 800, minimum: 1 })
  @IsNumber() @Min(1)
  T_K: number;
}
