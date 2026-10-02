import { IsArray, IsInt, IsNumber, IsOptional, Max, Min, ValidateIf, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { LayerDto } from '../../../thermal-exchange/dto/layer.dto';
import { CondensedFuelSelectionDto } from '../common';
import { FurnaceWallDto } from './furnace-wall.dto';

/** Packed-bed generator (chemical kinetics by layers) + secondary-air burnout */
export class BedCombustionInputDto extends CondensedFuelSelectionDto {
  @ApiProperty({ description: 'Bed height [m]', example: 0.5, minimum: 0.01 })
  @IsNumber() @Min(0.01)
  bedHeight_m: number;

  @ApiProperty({ description: 'Generator (bed) inner diameter [m]', example: 0.3, minimum: 0.01 })
  @IsNumber() @Min(0.01)
  diameter_m: number;

  @ApiProperty({ description: 'Number of layers', example: 25, minimum: 1, maximum: 500 })
  @IsInt() @Min(1) @Max(500)
  nLayers: number;

  @ApiPropertyOptional({ description: 'Primary (blast) air mass flow [kg/s]; give exactly one of mAirPrimary_kgs or airFlow_m3h', example: 0.0036, minimum: 0 })
  @IsOptional() @IsNumber() @Min(0)
  mAirPrimary_kgs?: number;

  @ApiPropertyOptional({ description: 'Primary air volume flow at inlet temperature, 1 atm [m³/h]; give exactly one of mAirPrimary_kgs or airFlow_m3h', example: 10, minimum: 0 })
  @IsOptional() @IsNumber() @Min(0)
  airFlow_m3h?: number;

  @ApiProperty({ description: 'Primary air temperature [K]', example: 400, minimum: 200 })
  @IsNumber() @Min(200)
  tAirPrimary_K: number;

  @ApiPropertyOptional({ description: 'Steam added after the max-CO₂ layer, % of the gas molar flow there (default 0)', example: 10, minimum: 0 })
  @IsOptional() @IsNumber() @Min(0)
  steamInjectionPercent?: number;

  @ApiPropertyOptional({ description: 'Steam temperature [K]; required when steamInjectionPercent > 0', example: 500, minimum: 373 })
  @ValidateIf((o: BedCombustionInputDto) => (o.steamInjectionPercent ?? 0) > 0) @IsNumber() @Min(373)
  steamT_K?: number;

  @ApiPropertyOptional({ type: [LayerDto], description: 'Generator wall layers, inside → outside; omit for an adiabatic generator' })
  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => LayerDto)
  generatorWallLayers?: LayerDto[];

  @ApiPropertyOptional({ description: 'Generator wall emissivity; required with generatorWallLayers', example: 0.85, minimum: 0, maximum: 1 })
  @ValidateIf((o: BedCombustionInputDto) => !!o.generatorWallLayers?.length) @IsNumber() @Min(0) @Max(1)
  generatorWallEmissivity?: number;

  @ApiPropertyOptional({ description: 'Ambient temperature [K]; required with generatorWallLayers or furnace', example: 293, minimum: 200 })
  @ValidateIf((o: BedCombustionInputDto) => !!o.generatorWallLayers?.length || !!o.furnace) @IsNumber() @Min(200)
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
