import { IsNumber, IsOptional, IsObject, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { OxideCompositionDto } from './common.dto';

export class MineralPhaseDto {
  @ApiProperty({
    type: OxideCompositionDto,
    description: 'Oxide composition in wt%',
    example: {
      SiO2: 50.5,
      Al2O3: 42.0,
      CaO: 3.0,
      Fe2O3: 2.0,
      Na2O: 0.5,
      K2O: 0.3,
      TiO2: 0.5,
      MgO: 1.2,
    },
  })
  @IsObject()
  @ValidateNested()
  @Type(() => OxideCompositionDto)
  composition: OxideCompositionDto;

  @ApiProperty({
    example: 1400,
    description: 'Temperature in °C (default: 1400)',
    required: false,
  })
  @IsNumber()
  @IsOptional()
  temperature?: number;
}

