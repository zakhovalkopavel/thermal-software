import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Species } from '../../enums/species.enum';
import { EquationValidityDto, MixtureValidityDto } from '../shared/equation-validity.dto';

export class GasPropertiesResultDto {
  @ApiProperty() Cp_J_kgK: number;
  @ApiProperty() H_J_mol: number;
  @ApiProperty() mu_Pa_s: number;
  @ApiProperty() lambda: number;
  @ApiProperty() rho_kg_m3: number;
  @ApiProperty() Pr: number;
  @ApiProperty() molecularWeight_kg_mol: number;
  @ApiPropertyOptional({ type: 'object', additionalProperties: { type: 'number' }, description: 'Diffusion coefficient per species' }) diffusion?: Partial<Record<Species, number>>;
  @ApiPropertyOptional({ type: EquationValidityDto, description: 'Aggregate Cp boundary status' })
  validity?: EquationValidityDto;
  @ApiPropertyOptional({ type: MixtureValidityDto, description: 'Per-component Cp boundary status' })
  mixtureValidity?: MixtureValidityDto;
}

