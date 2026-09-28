import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsNumber, Min } from 'class-validator';
import { RefractoryThermalMaterial } from '../enums/refractory-thermal-material.enum';

export class RefractoryProductQueryDto {
  @ApiProperty({ enum: RefractoryThermalMaterial, example: RefractoryThermalMaterial.CHAMOTTE_SOLID })
  @IsEnum(RefractoryThermalMaterial)
  material: RefractoryThermalMaterial;

  @ApiProperty({ description: 'Temperature [K]', example: 1273, minimum: 1 })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  T_K: number;
}
