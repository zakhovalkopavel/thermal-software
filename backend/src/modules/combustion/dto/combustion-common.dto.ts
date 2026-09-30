import { IsEnum, IsNumber, IsOptional, Max, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { FuelId } from '../enums/fuel-id.enum';
import { CondensedFuelDto } from './condensed-fuel.dto';

/** Fuel selection, fuel temperature and air quality for solid / liquid fuel inputs */
export class CondensedFuelSelectionDto {
  @ApiPropertyOptional({ enum: FuelId, description: 'Preset fuel (alternative to `fuel`)', example: FuelId.CharcoalBriquette })
  @IsOptional() @IsEnum(FuelId)
  fuelId?: FuelId;

  @ApiPropertyOptional({ type: CondensedFuelDto, description: 'Custom fuel (alternative to `fuelId`)' })
  @IsOptional() @ValidateNested() @Type(() => CondensedFuelDto)
  fuel?: CondensedFuelDto;

  @ApiPropertyOptional({ description: 'Fuel inlet temperature [K] (default 298.15)', example: 298.15, minimum: 200 })
  @IsOptional() @IsNumber() @Min(200)
  tFuel_K?: number;

  @ApiPropertyOptional({ description: 'O₂ vol fraction in dry air (default 0.21)', example: 0.21, minimum: 0.01, maximum: 1 })
  @IsOptional() @IsNumber() @Min(0.01) @Max(1)
  pO2?: number;

  @ApiPropertyOptional({ description: 'Air humidity — water mass per mass of dry air (default 0)', example: 0.01, minimum: 0 })
  @IsOptional() @IsNumber() @Min(0)
  wH2Om?: number;
}

/** Fuel selection plus fuel flow (mass flow or LHV power) */
export class CondensedFuelSupplyDto extends CondensedFuelSelectionDto {
  @ApiPropertyOptional({ description: 'Fuel mass flow [kg/s] (alternative to fPower_W)', example: 0.001, minimum: 0 })
  @IsOptional() @IsNumber() @Min(0)
  mFuel_kgs?: number;

  @ApiPropertyOptional({ description: 'Fuel power on LHV basis [W] (alternative to mFuel_kgs)', example: 20_000, minimum: 0 })
  @IsOptional() @IsNumber() @Min(0)
  fPower_W?: number;
}
