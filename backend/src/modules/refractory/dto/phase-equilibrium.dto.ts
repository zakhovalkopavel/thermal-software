import { IsNotEmpty, IsNumber, IsObject, ValidateNested, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { OxideCompositionDto } from './common.dto';
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
export class PhaseCalculationResponseDto {
  @ApiProperty()
  liquid: {
    percent: number;
    mass: number;
    composition: Record<string, number>;
  };
  @ApiProperty()
  solid: {
    percent: number;
    mass: number;
    composition: Record<string, number>;
    mineralPhases: string[];
  };
  @ApiProperty()
  metadata: {
    temperature: number;
    totalMass: number;
    eutecticTemperature: number;
    estimatedLiquidus: number;
    calculatedAt: Date;
  };
  @ApiProperty({ type: [String] })
  warnings: string[];
}
