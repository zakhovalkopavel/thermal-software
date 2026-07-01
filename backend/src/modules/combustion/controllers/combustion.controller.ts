import { Controller, Post, Body } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CombustionService } from '../services/combustion.service';
import { CombustionInputDto } from '../dto/combustion-input.dto';
import { CombustionResultDto } from '../dto/combustion-result.dto';

@ApiTags('combustion')
@Controller('combustion')
export class CombustionController {
  constructor(private readonly combustionService: CombustionService) {}

  @Post('calculate')
  @ApiOperation({
    summary: 'Flame temperature & combustion products',
    description:
      'Iteratively solves the adiabatic flame temperature and returns smoke composition, ' +
      'fuel/air/smoke mass flows, and CO₂/H₂O partial pressures.',
  })
  @ApiBody({
    type: CombustionInputDto,
    examples: {
      naturalGasFurnace: {
        summary: 'Natural-gas furnace 5 kW, preheated air 300 °C, α = 1.2',
        value: {
          fPower_W: 5_000,
          fuelQ_Jkg: 35_000_000,
          kExcessAir: 1.2,
          tAirStart_K: 573,
        },
      },
      hotAirWithHumidity: {
        summary: 'Higher excess air, humid air (1 % H₂O by mass)',
        value: {
          fPower_W: 5_000,
          fuelQ_Jkg: 34_000_000,
          kExcessAir: 1.5,
          tAirStart_K: 673,
          wH2Om: 0.01,
        },
      },
    },
  })
  calculate(@Body() dto: CombustionInputDto): CombustionResultDto {
    return this.combustionService.calculate(dto);
  }
}
