import {
  IsNumber,
  IsOptional,
  IsObject,
  ValidateNested,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { OxideCompositionDto } from './common.dto';

export class ThermalConductivityDto {
  @ApiProperty({
    type: OxideCompositionDto,
    description: 'Oxide composition in wt%',
    example: {
      Al2O3: 85.0,
      SiO2: 12.0,
      Fe2O3: 2.0,
      TiO2: 1.0,
    },
  })
  @IsObject()
  @ValidateNested()
  @Type(() => OxideCompositionDto)
  composition: OxideCompositionDto;

  @ApiProperty({ example: 1000, description: 'Temperature in °C' })
  @IsNumber()
  temperature: number;

  @ApiProperty({
    example: 0.18,
    description: 'Porosity fraction (0–1, default: 0.20)',
    required: false,
  })
  @IsNumber()
  @Min(0)
  @Max(1)
  @IsOptional()
  porosity?: number;
}

