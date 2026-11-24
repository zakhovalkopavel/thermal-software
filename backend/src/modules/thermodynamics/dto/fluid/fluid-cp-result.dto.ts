import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EquationValidityDto } from '../shared/equation-validity.dto';
import { MixtureValidityDto } from '../shared/mixture-validity.dto';

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

  @ApiPropertyOptional({ type: EquationValidityDto, description: 'Correlation boundary status' })
  validity?: EquationValidityDto;

  @ApiPropertyOptional({ type: MixtureValidityDto, description: 'Per-component boundary status for mixtures' })
  mixtureValidity?: MixtureValidityDto;
}

