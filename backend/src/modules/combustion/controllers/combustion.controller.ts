import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiBody, ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CombustionService } from '../services/combustion.service';
import { SolidDirectInputDto, SolidDirectResultDto } from '../dto/solid-direct.dto';
import { SolidTwoStepInputDto, SolidTwoStepResultDto } from '../dto/solid-two-step.dto';
import { FluidFuelInputDto, FluidFuelResultDto } from '../dto/fluid-fuel.dto';
import { BedCombustionInputDto, BedCombustionResultDto } from '../dto/bed-combustion.dto';
import { FuelSummaryDto } from '../dto/condensed-fuel.dto';
import { FuelId } from '../enums/fuel-id.enum';

const CHARCOAL_LHV_30 = {
  name: 'Charcoal briquette, LHV 30 MJ/kg',
  elementalComp: { C: 0.85, H: 0.03, O: 0.10, N: 0.01, ash: 0.01 },
  lhv_J_kg: 30_000_000,
  specificHeat_J_kgK: 1100,
  porosity: 0.45,
  particleSize_m: 0.05,
  activityFactor: 1,
};

const WALL_LAYERS = [
  { material: 'chamotte_solid', thicknessMm: 65 },
  { material: 'chamotte_600',   thicknessMm: 65 },
];

@ApiTags('combustion')
@Controller('combustion')
export class CombustionController {
  constructor(private readonly combustionService: CombustionService) {}

  @Get('fuels')
  @ApiOperation({ summary: 'Preset fuels with LHV, formation enthalpy and stoichiometric air' })
  @ApiOkResponse({ type: [FuelSummaryDto] })
  fuels(): FuelSummaryDto[] {
    return this.combustionService.fuels();
  }

  @Post('solid/direct')
  @ApiOperation({
    summary: 'Mode 1 — direct solid fuel combustion',
    description:
      'Fuel + air (λ < 1, = 1 or > 1) → one-step equilibrium products (element balance + WGS Kp(T)). ' +
      'Adiabatic (or with a given heat loss) flame temperature from the absolute-enthalpy balance.',
  })
  @ApiBody({
    type: SolidDirectInputDto,
    examples: {
      briquetteLean: {
        summary: 'Charcoal briquette preset, 20 kW, λ = 1.2, cold air',
        value: { fuelId: FuelId.CharcoalBriquette, fPower_W: 20_000, kExcessAir: 1.2, tAir_K: 293 },
      },
      oakRich: {
        summary: 'Oak charcoal preset, 1 g/s, λ = 0.8, air 400 °C',
        value: { fuelId: FuelId.CharcoalOak, mFuel_kgs: 0.001, kExcessAir: 0.8, tAir_K: 673 },
      },
    },
  })
  @ApiCreatedResponse({ type: SolidDirectResultDto })
  solidDirect(@Body() dto: SolidDirectInputDto): SolidDirectResultDto {
    return this.combustionService.solidDirect(dto);
  }

  @Post('solid/two-step')
  @ApiOperation({
    summary: 'Mode 2 — two-step solid fuel combustion',
    description:
      'Step 1: fuel + primary air → generator gas at the computed T_step1 (generator heat loss). ' +
      'Step 2: generator gas + secondary air → flue gas at T_flame (furnace heat loss). ' +
      'Default primary air takes all carbon to CO.',
  })
  @ApiBody({
    type: SolidTwoStepInputDto,
    examples: {
      briquettePreheated: {
        summary: 'Charcoal briquette preset, preheated primary air 400 °C, λ = 1.3',
        value: {
          fuelId: FuelId.CharcoalBriquette, fPower_W: 20_000, kExcessAir: 1.3,
          tAirPrimary_K: 673, tAirSecondary_K: 573,
        },
      },
      lhvBasedWithLosses: {
        summary: 'Briquette analysis with LHV 30 MJ/kg, generator flux 7 kW/m² × 0.2 m²',
        value: {
          fuel: CHARCOAL_LHV_30, fPower_W: 20_000, kExcessAir: 1.3,
          tAirPrimary_K: 293, generatorHeatFlux_Wm2: 7000, generatorSurface_m2: 0.2, furnaceHeatLoss_W: 1000,
        },
      },
    },
  })
  @ApiCreatedResponse({ type: SolidTwoStepResultDto })
  solidTwoStep(@Body() dto: SolidTwoStepInputDto): SolidTwoStepResultDto {
    return this.combustionService.solidTwoStep(dto);
  }

  @Post('fluid')
  @ApiOperation({
    summary: 'Mode 3 — liquid or gaseous fuel',
    description:
      'Gaseous fuel by species mole fractions, or liquid fuel by elemental analysis + ΔHf/LHV; ' +
      'one-step combustion with air (same as step 2 of mode 2).',
  })
  @ApiBody({
    type: FluidFuelInputDto,
    examples: {
      naturalGas: {
        summary: 'Natural gas 10 kW, λ = 1.1, air 300 °C',
        value: { phase: 'gas', fuelGas: { CH4: 0.95, CO2: 0.01, N2: 0.04 }, fPower_W: 10_000, kExcessAir: 1.1, tAir_K: 573 },
      },
      dieselLike: {
        summary: 'Light fuel oil (elemental analysis, LHV 42.7 MJ/kg)',
        value: {
          phase: 'liquid',
          fuel: { name: 'Light fuel oil', elementalComp: { C: 0.86, H: 0.13, O: 0, N: 0, S: 0.01, ash: 0 }, lhv_J_kg: 42_700_000 },
          fPower_W: 50_000, kExcessAir: 1.15, tAir_K: 293,
        },
      },
    },
  })
  @ApiCreatedResponse({ type: FluidFuelResultDto })
  fluid(@Body() dto: FluidFuelInputDto): FluidFuelResultDto {
    return this.combustionService.fluidFuel(dto);
  }

  @Post('bed')
  @ApiOperation({
    summary: 'Mode 4 — packed-bed generator by layers (chemical kinetics) + burnout',
    description:
      'Layer march from the grate: char surface and gas-phase kinetics (Arrhenius, Thiele), Gunn heat ' +
      'transfer, Ergun pressure drop, generator wall loss (multilayer wall), optional steam injection. ' +
      'The bed outlet gas is burned with secondary air (same as step 2 of mode 2) with furnace wall loss.',
  })
  @ApiBody({
    type: BedCombustionInputDto,
    examples: {
      briquetteBed: {
        summary: 'Charcoal briquette preset, 10 m³/h blast at 400 K, insulated generator, λ = 1.3',
        value: {
          fuelId: FuelId.CharcoalBriquette, airFlow_m3h: 10, tAirPrimary_K: 400,
          bedHeight_m: 0.5, diameter_m: 0.3, nLayers: 25,
          generatorWallLayers: WALL_LAYERS, kExcessAir: 1.3, tAirSecondary_K: 573,
          furnace: { diameter_m: 0.4, length_m: 1, wallLayers: WALL_LAYERS },
        },
      },
      steamInjection: {
        summary: 'LHV-based charcoal with 10 % steam injection, adiabatic generator',
        value: { fuel: CHARCOAL_LHV_30, airFlow_m3h: 10, tAirPrimary_K: 400, steamInjectionPercent: 10, steamT_K: 500 },
      },
    },
  })
  @ApiCreatedResponse({ type: BedCombustionResultDto })
  bed(@Body() dto: BedCombustionInputDto): BedCombustionResultDto {
    return this.combustionService.bedCombustion(dto);
  }
}
