import { IsNumber, IsOptional, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { CondensedFuelSelectionDto } from './condensed-fuel-selection.dto';

/** Fuel selection plus fuel flow (mass flow or LHV power) */
export class CondensedFuelSupplyDto extends CondensedFuelSelectionDto {
  @ApiPropertyOptional({ description: 'Fuel mass flow [kg/s] (alternative to fPower_W)', example: 0.001, minimum: 0 })
  @IsOptional() @IsNumber() @Min(0)
  mFuel_kgs?: number;

  @ApiPropertyOptional({ description: 'Fuel power on LHV basis [W] (alternative to mFuel_kgs)', example: 20_000, minimum: 0 })
  @IsOptional() @IsNumber() @Min(0)
  fPower_W?: number;
}
