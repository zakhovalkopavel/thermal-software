import { IsNumber, IsOptional, IsString, Max, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { FuelPhase } from '../data/fuels/fuel.interface';

export class ElementalCompositionDto {
  @ApiProperty({ description: 'Carbon mass fraction', example: 0.85, minimum: 0, maximum: 1 })
  @IsNumber() @Min(0) @Max(1) C: number;

  @ApiProperty({ description: 'Hydrogen mass fraction', example: 0.03, minimum: 0, maximum: 1 })
  @IsNumber() @Min(0) @Max(1) H: number;

  @ApiProperty({ description: 'Oxygen mass fraction', example: 0.10, minimum: 0, maximum: 1 })
  @IsNumber() @Min(0) @Max(1) O: number;

  @ApiProperty({ description: 'Nitrogen mass fraction', example: 0.01, minimum: 0, maximum: 1 })
  @IsNumber() @Min(0) @Max(1) N: number;

  @ApiPropertyOptional({ description: 'Sulfur mass fraction', example: 0, minimum: 0, maximum: 1 })
  @IsOptional() @IsNumber() @Min(0) @Max(1) S?: number;

  @ApiProperty({ description: 'Ash mass fraction', example: 0.01, minimum: 0, maximum: 1 })
  @IsNumber() @Min(0) @Max(1) ash: number;

  @ApiPropertyOptional({ description: 'Moisture (free water) mass fraction', example: 0, minimum: 0, maximum: 1 })
  @IsOptional() @IsNumber() @Min(0) @Max(1) moisture?: number;
}

/** Custom solid or liquid fuel; give heatOfFormation_J_kg or lhv_J_kg */
export class CondensedFuelDto {
  @ApiPropertyOptional({ description: 'Fuel name', example: 'Custom coke' })
  @IsOptional() @IsString()
  name?: string;

  @ApiProperty({ type: ElementalCompositionDto, description: 'As-fired elemental analysis (mass fractions, sum = 1)' })
  @ValidateNested() @Type(() => ElementalCompositionDto)
  elementalComp: ElementalCompositionDto;

  @ApiPropertyOptional({ description: 'Formation enthalpy [J/kg]', example: -8_500_000 })
  @IsOptional() @IsNumber()
  heatOfFormation_J_kg?: number;

  @ApiPropertyOptional({ description: 'Lower heating value, as fired [J/kg]', example: 30_000_000, minimum: 0 })
  @IsOptional() @IsNumber() @Min(0)
  lhv_J_kg?: number;

  @ApiPropertyOptional({ description: 'Fuel specific heat [J/(kg·K)] (default 1500)', example: 1100, minimum: 0 })
  @IsOptional() @IsNumber() @Min(0)
  specificHeat_J_kgK?: number;

  @ApiPropertyOptional({ description: 'Bed porosity [-] (bed model)', example: 0.45, minimum: 0.01, maximum: 0.99 })
  @IsOptional() @IsNumber() @Min(0.01) @Max(0.99)
  porosity?: number;

  @ApiPropertyOptional({ description: 'Bulk density [kg/m³] (bed model)', example: 450, minimum: 1 })
  @IsOptional() @IsNumber() @Min(1)
  bulkDensity_kg_m3?: number;

  @ApiPropertyOptional({ description: 'Particle size [m] (bed model)', example: 0.05, minimum: 0.0001 })
  @IsOptional() @IsNumber() @Min(0.0001)
  particleSize_m?: number;

  @ApiPropertyOptional({ description: 'Activity factor [-] (bed model)', example: 1, minimum: 0 })
  @IsOptional() @IsNumber() @Min(0)
  activityFactor?: number;

  @ApiPropertyOptional({ description: 'Surface emissivity [-] (bed model)', example: 0.85, minimum: 0, maximum: 1 })
  @IsOptional() @IsNumber() @Min(0) @Max(1)
  emissivity?: number;
}

export class FuelSummaryDto {
  @ApiProperty() id: string;
  @ApiProperty() name: string;
  @ApiProperty({ enum: FuelPhase }) phase: FuelPhase;
  @ApiProperty({ description: 'Lower heating value [J/kg]' }) lhv_Jkg: number;
  @ApiProperty({ description: 'Formation enthalpy of the fuel at 298.15 K [J/kg]' })
  heatOfFormation_Jkg: number;
  @ApiPropertyOptional({
    type: 'object', additionalProperties: { type: 'number' },
    description: 'Gaseous fuel mole fractions (gas presets only)',
  })
  moleFractions?: Record<string, number>;
  @ApiProperty({ description: 'Stoichiometric dry air per kg fuel [kg/kg]' }) stoichAir_kgkg: number;
}
