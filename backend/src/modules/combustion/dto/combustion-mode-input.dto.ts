import { IsEnum, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CombustionMode } from '../enums/combustion-mode.enum';
import { SolidDirectInputDto } from './solid-direct.dto';
import { SolidTwoStepInputDto } from './solid-two-step.dto';
import { FluidFuelInputDto } from './fluid-fuel.dto';
import { BedCombustionInputDto } from './bed-combustion.dto';

/** Combustion model selection for consumers of the flue gas (recuperator); only the input of `mode` is used */
export class CombustionModeInputDto {
  @ApiProperty({ enum: CombustionMode, description: 'Combustion model', example: CombustionMode.Fluid })
  @IsEnum(CombustionMode)
  mode: CombustionMode;

  @ApiPropertyOptional({ type: SolidDirectInputDto, description: 'Input of mode `solid-direct`' })
  @IsOptional() @ValidateNested() @Type(() => SolidDirectInputDto)
  solidDirect?: SolidDirectInputDto;

  @ApiPropertyOptional({ type: SolidTwoStepInputDto, description: 'Input of mode `solid-two-step`' })
  @IsOptional() @ValidateNested() @Type(() => SolidTwoStepInputDto)
  solidTwoStep?: SolidTwoStepInputDto;

  @ApiPropertyOptional({ type: FluidFuelInputDto, description: 'Input of mode `fluid`' })
  @IsOptional() @ValidateNested() @Type(() => FluidFuelInputDto)
  fluid?: FluidFuelInputDto;

  @ApiPropertyOptional({ type: BedCombustionInputDto, description: 'Input of mode `bed`' })
  @IsOptional() @ValidateNested() @Type(() => BedCombustionInputDto)
  bed?: BedCombustionInputDto;
}
