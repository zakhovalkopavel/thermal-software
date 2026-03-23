import { IsEnum, IsNumber, IsObject, IsOptional, IsString, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Species } from '../enums/species.enum';

export class GasMixtureInputDto {
  @ApiProperty({ description: 'Mole or mass fractions by species, must sum to 1' })
  @IsObject()
  composition: Partial<Record<Species, number>>;

  @ApiProperty({ description: 'Temperature [K]', minimum: 100, maximum: 6000 })
  @IsNumber() @Min(100) @Max(6000)
  T_K: number;

  @ApiPropertyOptional({ description: 'Pressure [atm], default 1.0', minimum: 0.1, maximum: 300 })
  @IsOptional() @IsNumber() @Min(0.1) @Max(300)
  P_atm?: number;

  @ApiPropertyOptional({ enum: ['mole', 'mass'], description: 'Fraction type, default mole' })
  @IsOptional() @IsString()
  fractionType?: 'mole' | 'mass';
}

export class GasPropertiesResultDto {
  @ApiProperty() Cp_J_kgK: number;
  @ApiProperty() H_J_mol: number;
  @ApiProperty() mu_Pa_s: number;
  @ApiProperty() lambda_W_mK: number;
  @ApiProperty() rho_kg_m3: number;
  @ApiProperty() Pr: number;
  @ApiProperty() molecularWeight_kg_mol: number;
  @ApiPropertyOptional() diffusion?: Partial<Record<Species, number>>;
}

export class CpComparisonEntryDto {
  @ApiProperty() index: number;
  @ApiProperty() type: string;
  @ApiProperty() ref: number;
  @ApiProperty() value: number;
  @ApiProperty() rangeValid: boolean;
}

