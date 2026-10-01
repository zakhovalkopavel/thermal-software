import { ApiProperty } from '@nestjs/swagger';
import { AlphaResult } from '../interfaces/alpha-result.interface';
import { AlphaResultDto } from './alpha-result.dto';

export class BetweenLayerDto {
  @ApiProperty()
  name:     string;
  @ApiProperty()
  tCelsius: number;
}

export class MultilayerWallResultDto {
  @ApiProperty({ description: 'Inner surface temperature [K]' })
  tInner_K: number;
  @ApiProperty({ description: 'Outer surface temperature [K]' })
  tOuter_K: number;
  @ApiProperty({ description: 'Log-mean gas temperature after furnace [K]' })
  tGasEnd_K: number;
  @ApiProperty({ description: 'Log-mean gas temperature inside furnace [K]' })
  tGasAverage_K: number;
  @ApiProperty({ type: [BetweenLayerDto], description: 'Temperatures at each layer interface' })
  betweenLayers: BetweenLayerDto[];
  @ApiProperty({ description: 'Total heat flux entering from flame side [W]' })
  fluxInner_W: number;
  @ApiProperty({ description: 'Total heat flux leaving outer surface [W]' })
  fluxOuter_W: number;
  @ApiProperty({ description: 'Inner surface heat flux density [W/m²]' })
  fluxInnerDensity_Wm2: number;
  @ApiProperty({ description: 'Inner surface area [m²]' })
  sInner_m2: number;
  @ApiProperty({ description: 'Outer surface area [m²]' })
  sOuter_m2: number;
  @ApiProperty({ type: AlphaResultDto, description: 'Inner HTC breakdown' })
  alphaInner: AlphaResult;
  @ApiProperty({ description: 'Outer surface HTC [W/(m²·K)]' })
  alphaOuter_Wm2K: number;
  @ApiProperty({ description: 'Total wall thickness [mm]' })
  totalThickness_mm: number;
}
