import { Controller, Post, Body } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RecuperatorService } from '../services/recuperator.service';
import { RecuperatorInputDto } from '../dto/recuperator-input.dto';
import { RecuperatorResultDto } from '../dto/recuperator-result.dto';

@ApiTags('recuperator')
@Controller('recuperator')
export class RecuperatorController {
  constructor(private readonly recuperatorService: RecuperatorService) {}

  @Post('calculate')
  @ApiOperation({
    summary: 'Optimise counter-flow recuperator dimensions',
    description:
      'Grid-search optimiser: sweeps wall thickness and channel dimension around the starting point ' +
      'to find the combination that minimises recuperator length while satisfying the energy-balance criterion. ' +
      'Returns optimal geometry, heat transfer results and combustion conditions.',
  })
  @ApiBody({
    type: RecuperatorInputDto,
    examples: {
      circleChannels: {
        summary: '5 kW furnace — circular channels, 100 air / 81 smoke, α = 1.2',
        value: {
          fPower_W: 5_000,
          fuelQ_Jkg: 35_000_000,
          kExcessAir: 1.2,
          tAirStart_K: 573,
          holeForm: 'circle',
          d0_m: 0.04,
          refractoryThickness_m: 0.003,
          nAir: 100,
          nSmoke: 81,
          wantedRecuperatorLength_m: 1.5,
          thermalInsulationThickness_m: 0.05,
          refractoryLambda_WmK: 1.2,
          refractoryEmissivity: 0.85,
          surfaceEmissivity: 0.9,
          surfaceArea_m2: 5.0,
        },
      },
      squareChannelsHumid: {
        summary: 'Square channels, humid air, turbulence correction on',
        value: {
          fPower_W: 5_000,
          fuelQ_Jkg: 34_000_000,
          kExcessAir: 1.4,
          tAirStart_K: 623,
          holeForm: 'square',
          d0_m: 0.035,
          refractoryThickness_m: 0.004,
          nAir: 64,
          nSmoke: 49,
          wantedRecuperatorLength_m: 1.2,
          thermalInsulationThickness_m: 0.06,
          refractoryLambda_WmK: 1.0,
          refractoryEmissivity: 0.82,
          surfaceEmissivity: 0.88,
          surfaceArea_m2: 3.0,
          wH2Om: 0.01,
          smokeTurbulence: true,
        },
      },
    },
  })
  calculate(@Body() dto: RecuperatorInputDto): RecuperatorResultDto {
    return this.recuperatorService.calculate(dto);
  }
}
