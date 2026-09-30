import { IsArray, IsInt, IsNumber, IsOptional, Max, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { LayerDto } from '../../thermal-exchange/dto/layer.dto';
import { CondensedFuelSelectionDto } from './combustion-common.dto';
import { FuelSummaryDto } from './condensed-fuel.dto';
import { CombustionStepResultDto, SpeciesValues } from './combustion-step-result.dto';

export class FurnaceWallDto {
  @ApiProperty({ description: 'Furnace (burnout chamber) inner diameter [m]', example: 0.4, minimum: 0.01 })
  @IsNumber() @Min(0.01)
  diameter_m: number;

  @ApiProperty({ description: 'Furnace length [m]', example: 1.0, minimum: 0.01 })
  @IsNumber() @Min(0.01)
  length_m: number;

  @ApiProperty({ type: [LayerDto], description: 'Furnace wall layers, inside → outside' })
  @IsArray() @ValidateNested({ each: true }) @Type(() => LayerDto)
  wallLayers: LayerDto[];

  @ApiPropertyOptional({ description: 'Wall emissivity (default 0.85)', example: 0.85, minimum: 0, maximum: 1 })
  @IsOptional() @IsNumber() @Min(0) @Max(1)
  emissivity?: number;
}

/** Packed-bed generator (chemical kinetics by layers) + secondary-air burnout */
export class BedCombustionInputDto extends CondensedFuelSelectionDto {
  @ApiPropertyOptional({ description: 'Bed height [m] (default 0.5)', example: 0.5, minimum: 0.01 })
  @IsOptional() @IsNumber() @Min(0.01)
  bedHeight_m?: number;

  @ApiPropertyOptional({ description: 'Generator (bed) inner diameter [m] (default 0.3)', example: 0.3, minimum: 0.01 })
  @IsOptional() @IsNumber() @Min(0.01)
  diameter_m?: number;

  @ApiPropertyOptional({ description: 'Number of layers (default 25)', example: 25, minimum: 1, maximum: 500 })
  @IsOptional() @IsInt() @Min(1) @Max(500)
  nLayers?: number;

  @ApiPropertyOptional({ description: 'Primary (blast) air mass flow [kg/s] (alternative to airFlow_m3h)', example: 0.0036, minimum: 0 })
  @IsOptional() @IsNumber() @Min(0)
  mAirPrimary_kgs?: number;

  @ApiPropertyOptional({ description: 'Primary air volume flow at inlet temperature, 1 atm [m³/h] (legacy airFlow_m3h)', example: 10, minimum: 0 })
  @IsOptional() @IsNumber() @Min(0)
  airFlow_m3h?: number;

  @ApiPropertyOptional({ description: 'Primary air temperature [K] (default 400)', example: 400, minimum: 200 })
  @IsOptional() @IsNumber() @Min(200)
  tAirPrimary_K?: number;

  @ApiPropertyOptional({ description: 'Steam added after the max-CO₂ layer, % of the gas molar flow there (default 0)', example: 10, minimum: 0 })
  @IsOptional() @IsNumber() @Min(0)
  steamInjectionPercent?: number;

  @ApiPropertyOptional({ description: 'Steam temperature [K] (default 500)', example: 500, minimum: 373 })
  @IsOptional() @IsNumber() @Min(373)
  steamT_K?: number;

  @ApiPropertyOptional({ type: [LayerDto], description: 'Generator wall layers, inside → outside; omit for an adiabatic generator' })
  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => LayerDto)
  generatorWallLayers?: LayerDto[];

  @ApiPropertyOptional({ description: 'Generator wall emissivity (default 0.85)', example: 0.85, minimum: 0, maximum: 1 })
  @IsOptional() @IsNumber() @Min(0) @Max(1)
  generatorWallEmissivity?: number;

  @ApiPropertyOptional({ description: 'Ambient temperature [K] (default 293)', example: 293, minimum: 200 })
  @IsOptional() @IsNumber() @Min(200)
  tAmbient_K?: number;

  @ApiPropertyOptional({ description: 'Total excess air (primary + secondary) relative to the fuel burned in the bed', example: 1.3, minimum: 0 })
  @IsOptional() @IsNumber() @Min(0)
  kExcessAir?: number;

  @ApiPropertyOptional({ description: 'Secondary air mass flow [kg/s] (alternative to kExcessAir)', example: 0.004, minimum: 0 })
  @IsOptional() @IsNumber() @Min(0)
  mAirSecondary_kgs?: number;

  @ApiPropertyOptional({ description: 'Secondary air temperature [K] (default = primary)', example: 573, minimum: 200 })
  @IsOptional() @IsNumber() @Min(200)
  tAirSecondary_K?: number;

  @ApiPropertyOptional({ type: FurnaceWallDto, description: 'Furnace walls for the burnout heat loss (MultilayerWallService)' })
  @IsOptional() @ValidateNested() @Type(() => FurnaceWallDto)
  furnace?: FurnaceWallDto;

  @ApiPropertyOptional({ description: 'Fixed furnace heat loss [W] (alternative to `furnace`)', example: 0, minimum: 0 })
  @IsOptional() @IsNumber() @Min(0)
  furnaceHeatLoss_W?: number;
}

export class ReactionExtentsDto {
  @ApiProperty() r1: number;
  @ApiProperty() r2: number;
  @ApiProperty() r3: number;
  @ApiProperty() r31: number;
  @ApiProperty() r32: number;
  @ApiProperty() r33: number;
  @ApiProperty() r4: number;
  @ApiProperty() r41: number;
  @ApiProperty() r42: number;
  @ApiProperty() r43: number;
}

export class BedLayerResultDto {
  @ApiProperty() index: number;
  @ApiProperty({ description: 'Layer centre height above the grate [m]' }) z_m: number;
  @ApiProperty({ description: 'Gas temperature at layer outlet [K]' }) tGas_K: number;
  @ApiProperty({ description: 'Char surface temperature [K]' }) tSolid_K: number;
  @ApiProperty({ description: 'Gas temperature change in the layer [K]' }) deltaT_K: number;
  @ApiProperty({ type: 'object', additionalProperties: { type: 'number' }, description: 'Outlet mole fractions' })
  moleFractions: SpeciesValues;
  @ApiProperty({ description: 'Carbon gasified in the layer [kg/s]' }) carbonBurnRate_kgs: number;
  @ApiProperty({ description: 'Fuel consumed in the layer [kg/s]' }) fuelBurnRate_kgs: number;
  @ApiProperty({ description: 'Carbon burn rate per external char surface [g/(s·cm²)]' }) burnRatePerArea_g_s_cm2: number;
  @ApiProperty({ type: ReactionExtentsDto, description: 'Reaction extents [mol/s]' }) extents: ReactionExtentsDto;
  @ApiProperty({ description: 'Wall heat loss [W]' }) wallLoss_W: number;
  @ApiProperty({ description: 'Inner wall temperature [K] (null when adiabatic)', nullable: true, type: Number }) tWallInner_K: number | null;
  @ApiProperty({ description: 'Outer wall temperature [K] (null when adiabatic)', nullable: true, type: Number }) tWallOuter_K: number | null;
  @ApiProperty({ description: 'Gas–particle heat transfer coefficient [W/(m²·K)]' }) hConv_Wm2K: number;
  @ApiProperty({ description: 'Superficial gas velocity [m/s]' }) velocity_ms: number;
  @ApiProperty({ description: 'Pressure drop of the layer [Pa]' }) pressureDrop_Pa: number;
  @ApiProperty() D_O2_m2s: number;
  @ApiProperty() D_CO2_m2s: number;
  @ApiProperty() D_H2O_m2s: number;
  @ApiProperty({ description: 'Steam injected at the outlet of this layer' }) steamInjected: boolean;
}

export class BedCombustionResultDto {
  @ApiProperty({ type: FuelSummaryDto }) fuel: FuelSummaryDto;
  @ApiProperty({ type: [BedLayerResultDto] }) layers: BedLayerResultDto[];
  @ApiProperty({ description: 'Fuel burned in the bed [kg/s]' }) mFuel_kgs: number;
  @ApiProperty({ description: 'Fuel power of the burned fuel, LHV basis [W]' }) fPower_W: number;
  @ApiProperty({ description: 'Carbon gasified [kg/s]' }) carbonBurnRate_kgs: number;
  @ApiProperty({ description: 'Ash released [kg/s]' }) ash_kgs: number;
  @ApiProperty({ description: 'Primary air incl. humidity [kg/s]' }) mAirPrimary_kgs: number;
  @ApiProperty({ description: 'Steam injected [kg/s]' }) mSteam_kgs: number;
  @ApiProperty({ description: 'Secondary air incl. humidity [kg/s]' }) mAirSecondary_kgs: number;
  @ApiProperty({ description: 'Excess air of the primary air relative to the burned fuel [-]' }) primaryExcessAir: number;
  @ApiProperty({ description: 'Generator wall heat loss [W]' }) generatorHeatLoss_W: number;
  @ApiProperty({ description: 'Bed pressure drop [Pa]' }) pressureDrop_Pa: number;
  @ApiProperty({ description: 'Top of the oxidation zone (CO < 1 %, O₂ > 1 %) [m]', nullable: true, type: Number })
  oxidationZoneHeight_m: number | null;
  @ApiProperty({ description: 'Generator gas temperature at the bed outlet [K]' }) tStep1_K: number;
  @ApiProperty({ type: 'object', additionalProperties: { type: 'number' }, description: 'Generator gas mole flows [mol/s]' })
  generatorGasMoleFlows_mols: SpeciesValues;
  @ApiProperty({ type: 'object', additionalProperties: { type: 'number' }, description: 'Generator gas mole fractions' })
  generatorGasMoleFractions: SpeciesValues;
  @ApiProperty({ description: 'Generator gas mass flow [kg/s]' }) mGeneratorGas_kgs: number;
  @ApiProperty({ description: 'Largest relative element mismatch over the bed' }) elementBalanceResidual: number;
  @ApiProperty({ description: 'Bed energy balance residual [W]' }) energyBalanceResidual_W: number;
  @ApiProperty({ description: 'Flame temperature after secondary air [K]' }) tFlame_K: number;
  @ApiProperty({ type: CombustionStepResultDto, description: 'Burnout step (generator gas + secondary air)' })
  burnout: CombustionStepResultDto;
}
