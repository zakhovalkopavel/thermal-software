import { IsNotEmpty, IsNumber, IsObject, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { OxideCompositionDto } from './common.dto';

export class GlassViscosityDto {
  @ApiProperty({ type: OxideCompositionDto })
  @IsNotEmpty()
  @IsObject()
  @ValidateNested()
  @Type(() => OxideCompositionDto)
  composition: OxideCompositionDto;

  @ApiProperty({ example: 1200, description: 'Temperature in °C' })
  @IsNotEmpty()
  @IsNumber()
  temperature: number;
}

