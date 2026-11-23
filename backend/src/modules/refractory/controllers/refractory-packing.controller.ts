import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { BlendOptimizerService } from '../services/particle-packing/blend-optimizer.service';
import { PSDCalculatorService } from '../services/particle-packing/psd-calculator.service';
import { PackingService } from '../services/particle-packing/packing.service';
import { ParticipationService } from '../services/particle-packing/participation.service';
import { WaterDemandService } from '../services/particle-packing/water-demand.service';
import { BlendOptimizationDto } from '../dto/blend-optimization/blend-optimization.dto';
import { AndreasenPsdDto } from '../dto/psd/andreasen-psd.dto';
import { FunkDingerPsdDto } from '../dto/psd/funk-dinger-psd.dto';
import { PackingCpmDto } from '../dto/packing/packing-cpm.dto';
import { PackingFurnasDto } from '../dto/packing/packing-furnas.dto';
import { ParticipationDto } from '../dto/participation/participation.dto';
import { WaterDemandDto } from '../dto/water-demand/water-demand.dto';
import { WaterDemandRangeDto } from '../dto/water-demand/water-demand-range.dto';
import { BlendOptimizationResultDto } from '../dto/blend-optimization/blend-optimization-result.dto';
import { PsdResultDto } from '../dto/psd/psd-result.dto';
import { CpmPackingResultDto } from '../dto/packing/cpm-packing-result.dto';
import { PackingResultDto } from '../dto/packing/packing-result.dto';
import { ParticipationResultDto } from '../dto/participation/participation-result.dto';
import { WaterDemandResultDto } from '../dto/water-demand/water-demand-result.dto';
import { WaterDemandRangeResultDto } from '../dto/water-demand/water-demand-range-result.dto';

@ApiTags('Refractory Calculations')
@Controller('refractory')
export class RefractoryPackingController {
  constructor(
    private readonly blendOptimizerService: BlendOptimizerService,
    private readonly psdCalculatorService: PSDCalculatorService,
    private readonly packingService: PackingService,
    private readonly participationService: ParticipationService,
    private readonly waterDemandService: WaterDemandService,
  ) {}

  @Post('blend-optimization')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Optimize blend composition',
    description: 'Optimizes mass fractions of particle size fractions to best match a target Andreasen or Funk-Dinger PSD curve.',
  })
  @ApiResponse({ status: 200, description: 'Optimized blend result', type: [BlendOptimizationResultDto] })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  optimizeBlend(@Body() dto: BlendOptimizationDto) {
    return this.blendOptimizerService.optimize({
      fractions: dto.fractions,
      options: dto.options,
    });
  }

  @Post('psd/andreasen')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Andreasen discrete PSD',
    description: 'Calculates ideal mass fractions per Andreasen continuous distribution: P(D) = (D/Dmax)^q',
  })
  @ApiResponse({ status: 200, description: 'Mass fractions per fraction', type: PsdResultDto })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  andreasenPsd(@Body() dto: AndreasenPsdDto) {
    return this.psdCalculatorService.andreasenDiscrete(
      dto.fractions,
      dto.q,
      dto.Dmin_mm,
      dto.Dmax_mm,
    );
  }

  @Post('psd/funk-dinger')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Funk-Dinger discrete PSD',
    description: 'Modified Andreasen with non-zero Dmin: P(D) = (D^q − Dmin^q) / (Dmax^q − Dmin^q). Recommended Dmin_mm = 0.001.',
  })
  @ApiResponse({ status: 200, description: 'Mass fractions per fraction', type: PsdResultDto })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  funkDingerPsd(@Body() dto: FunkDingerPsdDto) {
    return this.psdCalculatorService.funkDingerDiscrete(
      dto.fractions,
      dto.q,
      dto.Dmin_mm,
      dto.Dmax_mm,
    );
  }

  @Post('packing/cpm')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Packing density — CPM',
    description: 'Compressible Packing Model (de Larrard 1999). Accounts for wall effects and optional compaction pressure.',
  })
  @ApiResponse({ status: 200, description: 'Packing fraction and porosity', type: CpmPackingResultDto })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  packingCpm(@Body() dto: PackingCpmDto) {
    return this.packingService.calculateCPM({
      massFractions: dto.massFractions,
      densities_kgm3: dto.densities_kgm3,
      diameters_mm: dto.diameters_mm,
      compactionPressure_MPa: dto.compactionPressure_MPa,
    });
  }

  @Post('packing/furnas')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Packing density — Furnas',
    description: 'Furnas sequential filling model (Furnas 1931). Simpler than CPM; no compaction pressure.',
  })
  @ApiResponse({ status: 200, description: 'Packing fraction and porosity', type: PackingResultDto })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  packingFurnas(@Body() dto: PackingFurnasDto) {
    return this.packingService.calculateFurnas(
      {
        massFractions: dto.massFractions,
        densities_kgm3: dto.densities_kgm3,
        diameters_mm: dto.diameters_mm,
      },
      dto.efficiencyFactor,
    );
  }

  @Post('participation')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Particle reaction participation',
    description: 'Calculates reaction participation factor for each size fraction (∝ 1/√d). Fine particles react more readily.',
  })
  @ApiResponse({ status: 200, description: 'Participation factors per fraction', type: ParticipationResultDto })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  calculateParticipation(@Body() dto: ParticipationDto) {
    return this.participationService.calculateParticipation(dto.fractions);
  }

  @Post('water-demand')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Water demand',
    description: 'Calculates water demand as % by mass: waterDemand = workabilityFactor × (1 − φ) × 100. Workability: FIRM=0.38, STANDARD=0.42, FLOWABLE=0.50.',
  })
  @ApiResponse({ status: 200, description: 'Water demand in % by mass', type: WaterDemandResultDto })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  calculateWaterDemand(@Body() dto: WaterDemandDto) {
    const waterDemand_pct = this.waterDemandService.calculateWaterDemand(
      dto.packingFraction,
      dto.workability as any,
    );
    return { waterDemand_pct };
  }

  @Post('water-demand/range')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Water demand range',
    description: 'Returns min (FIRM), typical (STANDARD), max (FLOWABLE) water demand for a given packing fraction.',
  })
  @ApiResponse({ status: 200, description: 'Min/typical/max water demand in % by mass', type: WaterDemandRangeResultDto })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  calculateWaterDemandRange(@Body() dto: WaterDemandRangeDto) {
    return this.waterDemandService.calculateWaterDemandRange(dto.packingFraction);
  }
}
