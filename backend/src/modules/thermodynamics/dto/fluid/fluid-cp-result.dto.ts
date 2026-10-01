import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class FluidCpResultDto {
  @ApiProperty({ description: 'Isobaric heat capacity [J/(kg·K)]' })
  Cp_J_kgK: number;

  @ApiPropertyOptional({ description: 'Isochoric heat capacity [J/(kg·K)] — Cv = Cp - R/M (ideal gas)' })
  Cv_J_kgK?: number;

  @ApiPropertyOptional({ description: 'Heat capacity ratio γ = Cp / Cv' })
  gamma?: number;

  @ApiProperty({ description: 'Mixture molar mass [kg/mol]' })
  molecularWeight_kg_mol: number;

  @ApiPropertyOptional({ description: 'Species key when a single pure species was used' })
  species?: string;

  @ApiProperty({ description: 'Temperature at which properties were evaluated [K]' })
  T_K: number;
}

