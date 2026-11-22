import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ShrinkageService } from '../services/thermal/shrinkage.service';
import { ThermalPerformanceService } from '../services/thermal/thermal-performance.service';
import { MixCompositionService } from '../services/composition/mix-composition.service';
import { MixThermalService } from '../services/thermal/mix-thermal.service';
import { ShrinkagePredictionDto } from '../dto/shrinkage/shrinkage-prediction.dto';
import { ThermalConductivityDto } from '../dto/thermal-conductivity/thermal-conductivity.dto';
import { MixCompositionInputDto } from '../dto/mix-composition/mix-composition-input.dto';
import { MixCompositionResultDto } from '../dto/mix-composition/mix-composition-result.dto';
import { MixThermalInputDto } from '../dto/mix-thermal/mix-thermal-input.dto';
import { MixThermalResultDto } from '../dto/mix-thermal/mix-thermal-result.dto';
import { ShrinkageResultDto } from '../dto/shrinkage/shrinkage-result.dto';
import { ThermalConductivityResultDto } from '../dto/thermal-conductivity/thermal-conductivity-result.dto';
import { toOxideCompositionRecord } from '../utils/oxide-composition-record.util';

@ApiTags('Refractory Calculations')
@Controller('refractory')
export class RefractoryThermalController {
  constructor(
    private readonly shrinkageService: ShrinkageService,
    private readonly thermalPerformanceService: ThermalPerformanceService,
    private readonly mixCompositionService: MixCompositionService,
    private readonly mixThermalService: MixThermalService,
  ) {}

  @Post('shrinkage')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Shrinkage prediction',
    description: 'Calculates drying (chemical) and firing (sintering) shrinkage over a temperature profile using the Master Sintering Curve model.',
  })
  @ApiResponse({ status: 200, description: 'Complete shrinkage result by stage', type: ShrinkageResultDto })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  calculateShrinkage(@Body() dto: ShrinkagePredictionDto) {
    return this.shrinkageService.calculateFromProfile({
      temperatureProfile_C: dto.temperatureProfile_C,
      waterCementRatio: dto.waterCementRatio,
      cementContent: dto.cementContent,
    });
  }

  @Post('thermal-conductivity')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Effective thermal conductivity',
    description: 'Calculates effective thermal conductivity using the Maxwell-Eucken equation for porous refractory media.',
  })
  @ApiResponse({ status: 200, description: 'Thermal conductivity, specific heat, diffusivity, density', type: ThermalConductivityResultDto })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  calculateThermalConductivity(@Body() dto: ThermalConductivityDto) {
    return this.thermalPerformanceService.calculateThermalConductivity(
      toOxideCompositionRecord(dto.composition),
      dto.temperature,
      dto.porosity,
    );
  }

  @Post('mix/composition')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Fired-basis chemical composition of a mix of library raw materials',
    description:
      'Mix components = GET /refractory/mix-components. Returns loss on ignition, the 8 accepted oxides ' +
      '(also rescaled to 100 % for the chemical endpoints), other oxides, non-oxide components by group, ' +
      'dropped metal impurities, true density of the fired mix and reliability warnings.',
  })
  @ApiResponse({ status: 200, type: MixCompositionResultDto })
  @ApiResponse({ status: 400, description: 'Invalid input, Σ massFraction = 0, or material not allowed in mixes' })
  @ApiResponse({ status: 404, description: 'Unknown material id' })
  calculateMixComposition(@Body() dto: MixCompositionInputDto): MixCompositionResultDto {
    return this.mixCompositionService.calculate(dto);
  }

  @Post('mix/thermal')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Thermal properties of a fired library raw material or mix versus temperature',
    description:
      'All fired phases are kept (SiC, TiN, AlN, C, … are not converted to oxides). Cp from NASA-9 condensed phases ' +
      '(Neumann–Kopp), dense λ from the library reference with a phonon / electronic temperature law, ' +
      'true density from the library, effective λ by Maxwell–Eucken with air in the pores.',
  })
  @ApiResponse({ status: 200, type: MixThermalResultDto })
  @ApiResponse({ status: 400, description: 'Invalid input, Σ massFraction = 0, or material not allowed in mixes' })
  @ApiResponse({ status: 404, description: 'Unknown material id' })
  calculateMixThermal(@Body() dto: MixThermalInputDto): MixThermalResultDto {
    return this.mixThermalService.calculate(dto);
  }
}
