import { Controller, Post, Body } from '@nestjs/common';
import { ApiBody, ApiCreatedResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
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
      'Returns optimal geometry, heat transfer results and combustion conditions. The smoke comes from the ' +
      'selected combustion mode (`combustion.mode`: solid-direct, solid-two-step, fluid, bed).',
  })
  @ApiBody({
    type: RecuperatorInputDto,
    examples: {
      circleChannels: {
        summary: '5 kW natural-gas furnace (mode fluid) — circular channels, 100 air / 81 smoke, λ = 1.2',
        value: {
          combustion: {
            mode: 'fluid',
            fluid: {
              phase: 'gas', fuelGas: { CH4: 0.95, CO2: 0.01, N2: 0.04 },
              fPower_W: 5_000, kExcessAir: 1.2, tAir_K: 573,
            },
          },
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
        summary: 'Charcoal briquette (mode solid-direct), square channels, humid air, turbulence correction on',
        value: {
          combustion: {
            mode: 'solid-direct',
            solidDirect: { fuelId: 'charcoal-briquette', fPower_W: 5_000, kExcessAir: 1.4, tAir_K: 623, wH2Om: 0.01 },
          },
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
          smokeTurbulence: true,
        },
      },
      bedGenerator: {
        summary: 'Packed-bed charcoal generator (mode bed), 10 m³/h blast, λ = 1.3',
        value: {
          combustion: {
            mode: 'bed',
            bed: { fuelId: 'charcoal-briquette', airFlow_m3h: 10, tAirPrimary_K: 400, kExcessAir: 1.3, tAirSecondary_K: 400 },
          },
          tAirStart_K: 400,
          holeForm: 'circle',
          d0_m: 0.03,
          refractoryThickness_m: 0.003,
          nAir: 49,
          nSmoke: 36,
          wantedRecuperatorLength_m: 1.0,
          thermalInsulationThickness_m: 0.05,
          refractoryLambda_WmK: 1.2,
          refractoryEmissivity: 0.85,
          surfaceEmissivity: 0.9,
          surfaceArea_m2: 2.0,
        },
      },
    },
  })
  @ApiCreatedResponse({ type: RecuperatorResultDto })
  calculate(@Body() dto: RecuperatorInputDto): RecuperatorResultDto {
    return this.recuperatorService.calculate(dto);
  }
}
