import { ArrayMinSize, IsArray, IsEnum, IsNotEmpty, IsNumber, IsOptional, Max, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { PHASE_EQUILIBRIUM_CONSTANTS } from '../../constants/phase-equilibrium.constants';
import { AlgorithmMode } from '../../enums/algorithm-mode.enum';
import { LegacyVariant } from '../../enums/legacy-variant.enum';
import { PhaseEquilibriumFractionInputDto } from './phase-equilibrium-fraction-input.dto';

export class PhaseEquilibriumInputDto {
  @ApiProperty({ type: [PhaseEquilibriumFractionInputDto] })
  @IsArray() @ArrayMinSize(1) @ValidateNested({ each: true })
  @Type(() => PhaseEquilibriumFractionInputDto)
  fractions: PhaseEquilibriumFractionInputDto[];
  @ApiProperty({
    example: 1450,
    minimum: PHASE_EQUILIBRIUM_CONSTANTS.minTemperature_C,
    maximum: PHASE_EQUILIBRIUM_CONSTANTS.maxTemperature_C,
    description: 'Firing temperature [°C]',
  })
  @IsNotEmpty() @IsNumber() @Type(() => Number)
  @Min(PHASE_EQUILIBRIUM_CONSTANTS.minTemperature_C) @Max(PHASE_EQUILIBRIUM_CONSTANTS.maxTemperature_C)
  temperature: number;
  @ApiProperty({ required: false, default: PHASE_EQUILIBRIUM_CONSTANTS.defaultHoldTime_hours, description: 'Hold time [h]' })
  @IsOptional() @IsNumber() @Type(() => Number)
  @Min(Number.EPSILON)
  holdTime_hours?: number = PHASE_EQUILIBRIUM_CONSTANTS.defaultHoldTime_hours;
  @ApiProperty({ required: false, description: 'Total mass of the mix [kg]' })
  @IsOptional() @IsNumber() @Type(() => Number)
  @Min(Number.EPSILON)
  totalMass?: number;
  @ApiProperty({ enum: AlgorithmMode, required: false, default: AlgorithmMode.CALPHAD })
  @IsOptional() @IsEnum(AlgorithmMode)
  algorithmMode?: AlgorithmMode = AlgorithmMode.CALPHAD;
  @ApiProperty({ enum: LegacyVariant, required: false })
  @IsOptional() @IsEnum(LegacyVariant)
  legacyVariant?: LegacyVariant;
}
