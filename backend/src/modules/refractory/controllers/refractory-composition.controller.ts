import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiExtraModels, getSchemaPath } from '@nestjs/swagger';
import { PhaseEquilibriumService } from '../services/composition/phase-equilibrium.service';
import { RefractorinessService } from '../services/composition/refractoriness.service';
import { GlassViscosityService } from '../services/composition/glass-viscosity.service';
import { MineralPhaseService } from '../services/composition/mineral-phase.service';
import { PhaseCalculationDto, PhaseCalculationResponseDto } from '../dto/phase-equilibrium/phase-equilibrium.dto';
import { MineralPhaseDto } from '../dto/mineral-phases/mineral-phase.dto';
import { RefractorinessDto } from '../dto/refractoriness/refractoriness.dto';
import { GlassViscosityDto } from '../dto/glass-viscosity/glass-viscosity.dto';
import { GlassViscosityProfileDto } from '../dto/glass-viscosity/glass-viscosity-profile.dto';
import { GlassTemperatureAtViscosityDto } from '../dto/glass-viscosity/glass-temperature-at-viscosity.dto';
import { GlassCompositionConvertDto } from '../dto/glass-viscosity/glass-composition-convert.dto';
import { ConversionDirectionDto } from '../enums/conversion-direction.enum';
import { MineralPhaseEntryDto } from '../dto/mineral-phases/mineral-phase-entry.dto';
import { RefractorinessResultDto } from '../dto/refractoriness/refractoriness-result.dto';
import { GlassViscosityResultDto } from '../dto/glass-viscosity/viscosity/glass-viscosity-result.dto';
import { SlagViscosityResultDto } from '../dto/glass-viscosity/viscosity/slag-viscosity-result.dto';
import { GlassViscosityProfileResultDto } from '../dto/glass-viscosity/curve/glass-viscosity-profile-result.dto';
import { TemperatureAtViscosityResultDto } from '../dto/glass-viscosity/curve/temperature-at-viscosity-result.dto';
import { CompositionConversionResultDto } from '../dto/glass-viscosity/composition-conversion-result.dto';
import { ViscosityModel } from '../enums/viscosity-model.enum';
import { toOxideCompositionRecord } from '../utils/oxide-composition-record.util';

@ApiTags('Refractory Calculations')
@Controller('refractory')
export class RefractoryCompositionController {
  constructor(
    private readonly phaseEquilibriumService: PhaseEquilibriumService,
    private readonly refractorinessService: RefractorinessService,
    private readonly glassViscosityService: GlassViscosityService,
    private readonly mineralPhaseService: MineralPhaseService,
  ) {}

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
      composition: toOxideCompositionRecord(dto.composition),
      temperature: dto.temperature,
      totalMass: dto.totalMass,
    });
  }

  @Post('mineral-phases')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Identify mineral phases',
    description: 'Identifies mineral phases present in the solid composition at a given temperature (mullite, corundum, spinel, etc.).',
  })
  @ApiResponse({ status: 200, description: 'Array of identified mineral phases', type: [MineralPhaseEntryDto] })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  identifyMineralPhases(@Body() dto: MineralPhaseDto) {
    return this.mineralPhaseService.identifyPhases(
      toOxideCompositionRecord(dto.composition),
      dto.temperature ?? 1400,
    );
  }

  @Post('refractoriness')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Refractoriness (PCE / RUL)',
    description: 'Calculates PCE (Pyrometric Cone Equivalent) and RUL (Refractoriness Under Load) temperature from oxide composition.',
  })
  @ApiResponse({ status: 200, description: 'Refractoriness result for chosen standard', type: RefractorinessResultDto })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  calculateRefractoriness(@Body() dto: RefractorinessDto) {
    return this.refractorinessService.calculateRefractoriness(
      toOxideCompositionRecord(dto.composition),
      dto.standard,
      dto.testTemperature,
    );
  }

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
  @ApiExtraModels(GlassViscosityResultDto, SlagViscosityResultDto)
  @ApiResponse({
    status: 200,
    description: 'Viscosity, log10(η), VTF parameters, fixed points; slag models (IIDA, NAKAMOTO_2007) return the slag shape',
    schema: { oneOf: [{ $ref: getSchemaPath(GlassViscosityResultDto) }, { $ref: getSchemaPath(SlagViscosityResultDto) }] },
  })
  @ApiResponse({ status: 400, description: 'Invalid composition or unsupported system' })
  calculateGlassViscosity(@Body() dto: GlassViscosityDto) {
    return this.glassViscosityService.calculateViscosity(
      dto.composition,
      dto.temperature,
      dto.model as unknown as ViscosityModel | undefined,
    );
  }

  @Post('glass-viscosity/profile')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Glass viscosity profile over multiple temperatures',
    description:
      'Evaluates log₁₀(η) at every temperature in `temperatures_C`. ' +
      'Also returns VTF parameters and all fixed points so the caller can render a full curve.',
  })
  @ApiResponse({ status: 200, description: 'Per-temperature viscosity points + VTF curve + fixed points', type: GlassViscosityProfileResultDto })
  @ApiResponse({ status: 400, description: 'Invalid composition or unsupported system' })
  calculateGlassViscosityProfile(@Body() dto: GlassViscosityProfileDto) {
    return this.glassViscosityService.calculateViscosityProfile(
      dto.composition,
      dto.temperatures_C,
      dto.model as unknown as ViscosityModel | undefined,
    );
  }

  @Post('glass-viscosity/temperature-at-viscosity')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Temperature at a target log₁₀(η)',
    description:
      'Inverse VTF lookup: returns the temperature (°C) at which the glass reaches `targetLogEta`.\n\n' +
      'Common targets: 1.0 = melting, 3.0 = working, 6.6 = softening, 12.0 = annealing, 13.5 = strain.',
  })
  @ApiResponse({ status: 200, description: 'Temperature in °C for the requested viscosity level', type: TemperatureAtViscosityResultDto })
  @ApiResponse({ status: 400, description: 'Invalid composition or unsupported system' })
  getTemperatureAtViscosity(@Body() dto: GlassTemperatureAtViscosityDto) {
    return this.glassViscosityService.getTemperatureAtViscosity(
      dto.composition,
      dto.targetLogEta,
      dto.model as unknown as ViscosityModel | undefined,
    );
  }

  @Post('utils/convert-composition')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Convert composition between wt% and mol%',
    description:
      '`wt_to_mol` — weight percent → mol percent using oxide molar masses.\n\n' +
      '`mol_to_wt` — mol percent → weight percent.\n\n' +
      'Universal utility: works for any oxide composition, not limited to glass viscosity.',
  })
  @ApiResponse({ status: 200, description: 'Converted composition with both input and output', type: CompositionConversionResultDto })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  convertComposition(@Body() dto: GlassCompositionConvertDto) {
    return this.glassViscosityService.convertComposition(
      dto.composition,
      dto.direction as ConversionDirectionDto,
    );
  }
}
