import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

// Services
import { PhaseEquilibriumService } from '../services/phase-equilibrium.service';
import { BlendOptimizerService } from '../services/blend-optimizer.service';
import { PSDCalculatorService } from '../services/psd-calculator.service';
import { PackingService } from '../services/packing.service';
import { ParticipationService } from '../services/participation.service';
import { WaterDemandService } from '../services/water-demand.service';
import { ShrinkageService } from '../services/shrinkage.service';
import { ThermalPerformanceService } from '../services/thermal-performance.service';
import { RefractorinessService } from '../services/refractoriness.service';
import { GlassViscosityService } from '../services/glass-viscosity.service';
import { MineralPhaseService } from '../services/mineral-phase.service';

// DTOs
import { PhaseCalculationDto, PhaseCalculationResponseDto } from '../dto/phase-equilibrium.dto';
import { BlendOptimizationDto } from '../dto/blend-optimization.dto';
import { MineralPhaseDto } from '../dto/mineral-phase.dto';
import { AndreasenPsdDto, FunkDingerPsdDto } from '../dto/psd-calculation.dto';
import { PackingCpmDto, PackingFurnasDto } from '../dto/packing-models.dto';
import { ParticipationDto } from '../dto/participation.dto';
import { WaterDemandDto, WaterDemandRangeDto } from '../dto/water-demand.dto';
import { ShrinkagePredictionDto } from '../dto/shrinkage-prediction.dto';
import { ThermalConductivityDto } from '../dto/thermal-conductivity.dto';
import { RefractorinessDto } from '../dto/refractoriness.dto';
import {
  GlassViscosityDto,
  GlassViscosityProfileDto,
  GlassTemperatureAtViscosityDto,
  GlassCompositionConvertDto,
  ConversionDirectionDto,
} from '../dto/glass-viscosity.dto';
import { ViscosityModel } from '../enums/viscosity-model.enum';

@ApiTags('Refractory Calculations')
@Controller('refractory')
export class RefractoryController {
  constructor(
    private readonly phaseEquilibriumService: PhaseEquilibriumService,
    private readonly blendOptimizerService: BlendOptimizerService,
    private readonly psdCalculatorService: PSDCalculatorService,
    private readonly packingService: PackingService,
    private readonly participationService: ParticipationService,
    private readonly waterDemandService: WaterDemandService,
    private readonly shrinkageService: ShrinkageService,
    private readonly thermalPerformanceService: ThermalPerformanceService,
    private readonly refractorinessService: RefractorinessService,
    private readonly glassViscosityService: GlassViscosityService,
    private readonly mineralPhaseService: MineralPhaseService,
  ) {}

  // ─── 1. Phase Equilibrium ────────────────────────────────────────────────────

  @Post('phase-equilibrium')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Calculate phase equilibrium',
    description: 'Calculates liquid-solid phase distribution at temperature based on oxide composition (lever rule + eutectic data).',
  })
  @ApiResponse({ status: 200, description: 'Phase equilibrium result', type: PhaseCalculationResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  calculatePhaseEquilibrium(@Body() dto: PhaseCalculationDto) {
    return this.phaseEquilibriumService.calculatePhaseEquilibrium({
      composition: dto.composition as Record<string, number>,
      temperature: dto.temperature,
      totalMass: dto.totalMass,
    });
  }

  // ─── 2. Mineral Phases ───────────────────────────────────────────────────────

  @Post('mineral-phases')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Identify mineral phases',
    description: 'Identifies mineral phases present in the solid composition at a given temperature (mullite, corundum, spinel, etc.).',
  })
  @ApiResponse({ status: 200, description: 'Array of identified mineral phases' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  identifyMineralPhases(@Body() dto: MineralPhaseDto) {
    return this.mineralPhaseService.identifyPhases(
      dto.composition as Record<string, number>,
      dto.temperature ?? 1400,
    );
  }

  // ─── 3. Blend Optimization ───────────────────────────────────────────────────

  @Post('blend-optimization')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Optimize blend composition',
    description: 'Optimizes mass fractions of particle size fractions to best match a target Andreasen or Funk-Dinger PSD curve.',
  })
  @ApiResponse({ status: 200, description: 'Optimized blend result' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  optimizeBlend(@Body() dto: BlendOptimizationDto) {
    return this.blendOptimizerService.optimize({
      fractions: dto.fractions,
      options: dto.options,
    });
  }

  // ─── 4. PSD — Andreasen ──────────────────────────────────────────────────────

  @Post('psd/andreasen')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Andreasen discrete PSD',
    description: 'Calculates ideal mass fractions per Andreasen continuous distribution: P(D) = (D/Dmax)^q',
  })
  @ApiResponse({ status: 200, description: 'Mass fractions per fraction' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  andreasenPsd(@Body() dto: AndreasenPsdDto) {
    return this.psdCalculatorService.andreasenDiscrete(
      dto.fractions,
      dto.q,
      dto.Dmin_mm,
      dto.Dmax_mm,
    );
  }

  // ─── 5. PSD — Funk-Dinger ────────────────────────────────────────────────────

  @Post('psd/funk-dinger')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Funk-Dinger discrete PSD',
    description: 'Modified Andreasen with non-zero Dmin: P(D) = (D^q − Dmin^q) / (Dmax^q − Dmin^q). Recommended Dmin_mm = 0.001.',
  })
  @ApiResponse({ status: 200, description: 'Mass fractions per fraction' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  funkDingerPsd(@Body() dto: FunkDingerPsdDto) {
    return this.psdCalculatorService.funkDingerDiscrete(
      dto.fractions,
      dto.q,
      dto.Dmin_mm,
      dto.Dmax_mm,
    );
  }

  // ─── 6. Packing — CPM ───────────────────────────────────────────────────────

  @Post('packing/cpm')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Packing density — CPM',
    description: 'Compressible Packing Model (de Larrard 1999). Accounts for wall effects and optional compaction pressure.',
  })
  @ApiResponse({ status: 200, description: 'Packing fraction and porosity' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  packingCpm(@Body() dto: PackingCpmDto) {
    return this.packingService.calculateCPM({
      massFractions: dto.massFractions,
      densities_kgm3: dto.densities_kgm3,
      diameters_mm: dto.diameters_mm,
      compactionPressure_MPa: dto.compactionPressure_MPa,
    });
  }

  // ─── 7. Packing — Furnas ────────────────────────────────────────────────────

  @Post('packing/furnas')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Packing density — Furnas',
    description: 'Furnas sequential filling model (Furnas 1931). Simpler than CPM; no compaction pressure.',
  })
  @ApiResponse({ status: 200, description: 'Packing fraction and porosity' })
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

  // ─── 8. Participation ────────────────────────────────────────────────────────

  @Post('participation')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Particle reaction participation',
    description: 'Calculates reaction participation factor for each size fraction (∝ 1/√d). Fine particles react more readily.',
  })
  @ApiResponse({ status: 200, description: 'Participation factors per fraction' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  calculateParticipation(@Body() dto: ParticipationDto) {
    return this.participationService.calculateParticipation(dto.fractions);
  }

  // ─── 9. Water Demand ─────────────────────────────────────────────────────────

  @Post('water-demand')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Water demand',
    description: 'Calculates water demand as % by mass: waterDemand = workabilityFactor × (1 − φ) × 100. Workability: FIRM=0.38, STANDARD=0.42, FLOWABLE=0.50.',
  })
  @ApiResponse({ status: 200, description: 'Water demand in % by mass' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  calculateWaterDemand(@Body() dto: WaterDemandDto) {
    const waterDemand_pct = this.waterDemandService.calculateWaterDemand(
      dto.packingFraction,
      dto.workability as any,
    );
    return { waterDemand_pct };
  }

  // ─── 10. Water Demand Range ──────────────────────────────────────────────────

  @Post('water-demand/range')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Water demand range',
    description: 'Returns min (FIRM), typical (STANDARD), max (FLOWABLE) water demand for a given packing fraction.',
  })
  @ApiResponse({ status: 200, description: 'Min/typical/max water demand in % by mass' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  calculateWaterDemandRange(@Body() dto: WaterDemandRangeDto) {
    return this.waterDemandService.calculateWaterDemandRange(dto.packingFraction);
  }

  // ─── 11. Shrinkage ───────────────────────────────────────────────────────────

  @Post('shrinkage')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Shrinkage prediction',
    description: 'Calculates drying (chemical) and firing (sintering) shrinkage over a temperature profile using the Master Sintering Curve model.',
  })
  @ApiResponse({ status: 200, description: 'Complete shrinkage result by stage' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  calculateShrinkage(@Body() dto: ShrinkagePredictionDto) {
    // The service requires a materials array; we supply a single generic entry
    const temperatures = dto.temperatureProfile_C;
    const materials = [{ activationEnergy_Jmol: 500000 }];
    const massFractions = [1.0];

    return this.shrinkageService.calculateCompleteShrinkage({
      materials,
      massFractions,
      temperatureProfile_C: temperatures,
      waterCementRatio: dto.waterCementRatio,
      cementContent: dto.cementContent,
    });
  }

  // ─── 12. Thermal Conductivity ────────────────────────────────────────────────

  @Post('thermal-conductivity')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Effective thermal conductivity',
    description: 'Calculates effective thermal conductivity using the Maxwell-Eucken equation for porous refractory media.',
  })
  @ApiResponse({ status: 200, description: 'Thermal conductivity, specific heat, diffusivity, density' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  calculateThermalConductivity(@Body() dto: ThermalConductivityDto) {
    return this.thermalPerformanceService.calculateThermalConductivity(
      dto.composition as Record<string, number>,
      dto.temperature,
      dto.porosity,
    );
  }

  // ─── 13. Refractoriness ──────────────────────────────────────────────────────

  @Post('refractoriness')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Refractoriness (PCE / RUL)',
    description: 'Calculates PCE (Pyrometric Cone Equivalent) and RUL (Refractoriness Under Load) temperature from oxide composition.',
  })
  @ApiResponse({ status: 200, description: 'Refractoriness result for chosen standard' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  calculateRefractoriness(@Body() dto: RefractorinessDto) {
    return this.refractorinessService.calculateRefractoriness(
      dto.composition as Record<string, number>,
      dto.standard,
      dto.testTemperature,
    );
  }

  // ─── 14. Glass Viscosity — single point ─────────────────────────────────────

  @Post('glass-viscosity')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Glass viscosity at one temperature',
    description:
      'Calculates log₁₀(η) and η at a single temperature. Returns VTF parameters, ' +
      'all fixed points (melting, working, softening, annealing, strain), and model metadata.\n\n' +
      'Model auto-selected unless `model` is specified. If the requested model is out of range ' +
      'for the composition, the best valid model is used and reported in `validation.warnings`.',
  })
  @ApiResponse({ status: 200, description: 'Viscosity, log10(η), VTF parameters, fixed points' })
  @ApiResponse({ status: 400, description: 'Invalid composition or unsupported system' })
  calculateGlassViscosity(@Body() dto: GlassViscosityDto) {
    return this.glassViscosityService.calculateViscosity(
      dto.composition,
      dto.temperature,
      dto.model as unknown as ViscosityModel | undefined,
    );
  }

  // ─── 15. Glass Viscosity — profile ──────────────────────────────────────────

  @Post('glass-viscosity/profile')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Glass viscosity profile over multiple temperatures',
    description:
      'Evaluates log₁₀(η) at every temperature in `temperatures_C`. ' +
      'Also returns VTF parameters and all fixed points so the caller can render a full curve.',
  })
  @ApiResponse({ status: 200, description: 'Per-temperature viscosity points + VTF curve + fixed points' })
  @ApiResponse({ status: 400, description: 'Invalid composition or unsupported system' })
  calculateGlassViscosityProfile(@Body() dto: GlassViscosityProfileDto) {
    return this.glassViscosityService.calculateViscosityProfile(
      dto.composition,
      dto.temperatures_C,
      dto.model as unknown as ViscosityModel | undefined,
    );
  }

  // ─── 16. Glass Viscosity — temperature at target viscosity ──────────────────

  @Post('glass-viscosity/temperature-at-viscosity')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Temperature at a target log₁₀(η)',
    description:
      'Inverse VTF lookup: returns the temperature (°C) at which the glass reaches `targetLogEta`.\n\n' +
      'Common targets: 1.0 = melting, 3.0 = working, 6.6 = softening, 12.0 = annealing, 13.5 = strain.',
  })
  @ApiResponse({ status: 200, description: 'Temperature in °C for the requested viscosity level' })
  @ApiResponse({ status: 400, description: 'Invalid composition or unsupported system' })
  getTemperatureAtViscosity(@Body() dto: GlassTemperatureAtViscosityDto) {
    return this.glassViscosityService.getTemperatureAtViscosity(
      dto.composition,
      dto.targetLogEta,
      dto.model as unknown as ViscosityModel | undefined,
    );
  }

  // ─── 17. Composition unit conversion (universal) ────────────────────────────

  @Post('utils/convert-composition')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Convert composition between wt% and mol%',
    description:
      '`wt_to_mol` — weight percent → mol percent using oxide molar masses.\n\n' +
      '`mol_to_wt` — mol percent → weight percent.\n\n' +
      'Universal utility: works for any oxide composition, not limited to glass viscosity.',
  })
  @ApiResponse({ status: 200, description: 'Converted composition with both input and output' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  convertComposition(@Body() dto: GlassCompositionConvertDto) {
    return this.glassViscosityService.convertComposition(
      dto.composition,
      dto.direction as ConversionDirectionDto,
    );
  }
}
