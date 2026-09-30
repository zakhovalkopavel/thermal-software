import { IsNumber, IsOptional, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CondensedFuelSupplyDto } from './combustion-common.dto';
import { FuelSummaryDto } from './condensed-fuel.dto';
import { CombustionStepResultDto } from './combustion-step-result.dto';

export class SolidDirectInputDto extends CondensedFuelSupplyDto {
  @ApiProperty({ description: 'Excess air ratio λ (<1 rich, 1 stoichiometric, >1 lean)', example: 1.2, minimum: 0.01 })
  @IsNumber() @Min(0.01)
  kExcessAir: number;

  @ApiProperty({ description: 'Air temperature [K]', example: 573, minimum: 200 })
  @IsNumber() @Min(200)
  tAir_K: number;

  @ApiPropertyOptional({ description: 'Heat removed from the flame [W] (default 0 — adiabatic)', example: 0, minimum: 0 })
  @IsOptional() @IsNumber() @Min(0)
  heatLoss_W?: number;
}

export class SolidDirectResultDto {
  @ApiProperty({ type: FuelSummaryDto }) fuel: FuelSummaryDto;
  @ApiProperty({ description: 'Fuel mass flow [kg/s]' }) mFuel_kgs: number;
  @ApiProperty({ description: 'Fuel power, LHV basis [W]' }) fPower_W: number;
  @ApiProperty({ description: 'Air mass flow incl. humidity [kg/s]' }) mAir_kgs: number;
  @ApiProperty({ description: 'Flame temperature [K]' }) tFlame_K: number;
  @ApiProperty({ type: CombustionStepResultDto }) combustion: CombustionStepResultDto;
}
