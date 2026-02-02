import { IsNotEmpty, IsString, IsNumber, IsObject, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { OxideCompositionDto } from './common.dto';

export class RefractorinessDto {
  @ApiProperty({ type: OxideCompositionDto })
  @IsNotEmpty()
  @IsObject()
  @ValidateNested()
  @Type(() => OxideCompositionDto)
  composition: OxideCompositionDto;

  @ApiProperty({
    example: 'ISO1893',
    enum: ['ISO1893', 'ASTM_C24', 'ASTM_C71', 'GOST4069'],
    description: 'Standard to use'
  })
  @IsNotEmpty()
  @IsString()
  standard: string;

  @ApiProperty({ example: 1400, description: 'Test temperature in °C', required: false })
  @IsNumber()
  testTemperature?: number;
}

