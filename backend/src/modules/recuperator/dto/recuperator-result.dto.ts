import { ApiProperty } from '@nestjs/swagger';

export class RecuperatorResultDto {
  @ApiProperty({ description: 'Required recuperator length [m]' })
  recuperatorLength_m:    number;
  @ApiProperty({ description: 'Optimised air preheat temperature [K]' })
  tAirEnd_K:              number;
  @ApiProperty({ description: 'Smoke exit temperature [K]' })
  tSmokeEnd_K:            number;
  @ApiProperty({ description: 'Smoke entry temperature [K]' })
  tSmokeStart_K:          number;
  @ApiProperty({ description: 'Adiabatic flame temperature [K]' })
  tFlame_K:               number;
  @ApiProperty({ description: 'Maximum flame temperature with full air preheat [K]' })
  maxFlameTemp_K:         number;
  @ApiProperty({ description: 'Energy returned to air / total smoke energy [%]' })
  energyReturnedPercent:  number;
  @ApiProperty({ description: 'Heat transferred to air [W]' })
  airEnergyIncrease_W:    number;
  @ApiProperty({ description: 'Heat lost by smoke [W]' })
  smokeEnergyDecrease_W:  number;
  @ApiProperty({ description: 'Total smoke energy from T_start to T_air_start [W]' })
  smokeTotalEnergy_W:     number;
  @ApiProperty({ description: 'Log-mean overall HTC [W/(m²·K)]' })
  alphaAverage_Wm2K:      number;
  @ApiProperty({ description: 'Log-mean temperature difference [K]' })
  averageDeltaT_K:        number;
  @ApiProperty({ description: 'Smoke cross-section area [m²]' })
  sSmoke_m2:              number;
  @ApiProperty({ description: 'Air cross-section area [m²]' })
  sAir_m2:                number;
  @ApiProperty({ description: 'Air equivalent diameter [m]' })
  dAir_m:                 number;
  @ApiProperty({ description: 'Smoke equivalent diameter [m]' })
  dSmoke_m:               number;
  @ApiProperty()
  wSmokeStart_ms:         number;
  @ApiProperty()
  wSmokeEnd_ms:           number;
  @ApiProperty()
  wAirStart_ms:           number;
  @ApiProperty()
  wAirEnd_ms:             number;
  @ApiProperty({ description: 'Fuel consumption [kg/h]' })
  mFuel_kgh:              number;
}
