import { IsNotEmpty, IsNumber, IsObject, ValidateNested, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { OxideCompositionDto } from '../common/oxide-composition.dto';

export class PhaseCalculationDto {
  @ApiProperty({ type: OxideCompositionDto })
  @IsNotEmpty() @IsObject() @ValidateNested()
  @Type(() => OxideCompositionDto)
  composition: OxideCompositionDto;
  @ApiProperty({ example: 1450, minimum: 500, maximum: 2000 })
  @IsNotEmpty() @IsNumber() @Min(500) @Max(2000)
  temperature: number;
  @ApiProperty({ example: 100, required: false, default: 100 })
  @IsNumber() @Min(0.01) @Type(() => Number)
  totalMass?: number;
}
