import { IsNotEmpty, IsNumber, IsObject, ValidateNested, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { OxideCompositionDto } from '../common/common.dto';
import { LiquidPhaseResultDto } from './liquid-phase-result.dto';
import { SolidPhaseResultDto } from './solid-phase-result.dto';
import { PhaseEquilibriumMetadataDto } from './phase-equilibrium-metadata.dto';
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
  @ApiProperty({ type: LiquidPhaseResultDto })
  liquid: {
    percent: number;
    mass: number;
    composition: Record<string, number>;
  };
  @ApiProperty({ type: SolidPhaseResultDto })
  solid: {
    percent: number;
    mass: number;
    composition: Record<string, number>;
    mineralPhases: string[];
  };
  @ApiProperty({ type: PhaseEquilibriumMetadataDto })
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
