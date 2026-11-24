import { ApiProperty } from '@nestjs/swagger';
import { FuelSummaryDto, CombustionStepResultDto } from '../common';

export class FluidFuelResultDto {
  @ApiProperty({ type: FuelSummaryDto }) fuel: FuelSummaryDto;
  @ApiProperty({ description: 'Fuel mass flow [kg/s]' }) mFuel_kgs: number;
  @ApiProperty({ description: 'Fuel power, LHV basis [W]' }) fPower_W: number;
  @ApiProperty({ description: 'Air mass flow incl. humidity [kg/s]' }) mAir_kgs: number;
  @ApiProperty({ description: 'Flame temperature [K]' }) tFlame_K: number;
  @ApiProperty({ type: CombustionStepResultDto }) combustion: CombustionStepResultDto;
}
