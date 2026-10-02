import { ApiProperty } from '@nestjs/swagger';
import { FuelSummaryDto, CombustionStepResultDto } from '../common';

export class SolidTwoStepResultDto {
  @ApiProperty({ type: FuelSummaryDto }) fuel: FuelSummaryDto;
  @ApiProperty({ description: 'Fuel mass flow [kg/s]' }) mFuel_kgs: number;
  @ApiProperty({ description: 'Fuel power, LHV basis [W]' }) fPower_W: number;
  @ApiProperty({ description: 'Primary excess air ratio used [-]' }) primaryExcessAir: number;
  @ApiProperty({ description: 'Primary air mass flow incl. humidity [kg/s]' }) mAirPrimary_kgs: number;
  @ApiProperty({ description: 'Secondary air mass flow incl. humidity [kg/s]' }) mAirSecondary_kgs: number;
  @ApiProperty({ description: 'Generator gas temperature [K]' }) tStep1_K: number;
  @ApiProperty({ description: 'Flame temperature after secondary air [K]' }) tFlame_K: number;
  @ApiProperty({ type: CombustionStepResultDto, description: 'Step 1 — generator (fuel + primary air)' })
  generator: CombustionStepResultDto;
  @ApiProperty({ type: CombustionStepResultDto, description: 'Step 2 — burnout (generator gas + secondary air)' })
  burnout: CombustionStepResultDto;
}
