import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PhaseEquilibriumService } from '../services/phase-equilibrium.service';
import { BlendOptimizerService } from '../services/blend-optimizer.service';
import { PhaseCalculationDto, PhaseCalculationResponseDto } from '../dto/phase-equilibrium.dto';
import { BlendOptimizationDto } from '../dto/blend-optimization.dto';
import { PackingCalculationDto } from '../dto/packing-calculation.dto';

@ApiTags('Refractory Calculations')
@Controller('api/v1/refractory')
export class RefractoryController {
  constructor(
    private readonly phaseEquilibriumService: PhaseEquilibriumService,
    private readonly blendOptimizerService: BlendOptimizerService,
  ) {}

  @Post('phase-equilibrium')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Calculate phase equilibrium',
    description: 'Calculates liquid-solid phase distribution at temperature based on oxide composition',
  })
  @ApiResponse({ status: 200, description: 'Success', type: PhaseCalculationResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  calculatePhaseEquilibrium(@Body() dto: PhaseCalculationDto) {
    return this.phaseEquilibriumService.calculatePhaseEquilibrium({
      composition: dto.composition as Record<string, number>,
      temperature: dto.temperature,
      totalMass: dto.totalMass,
    });
  }

  @Post('blend-optimization')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Optimize blend composition' })
  @ApiResponse({ status: 200, description: 'Success' })
  optimizeBlend(@Body() dto: BlendOptimizationDto) {
    return this.blendOptimizerService.optimize({
      fractions: dto.fractions,
      options: dto.options,
    });
  }

  @Post('packing-calculation')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Calculate packing density' })
  calculatePacking(@Body() dto: PackingCalculationDto) {
    return { message: 'Packing calculation not yet implemented' };
  }
}

