import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Species } from '../enums/species.enum';

export class GasPropertiesResultDto {
  @ApiProperty() Cp_J_kgK: number;
  @ApiProperty() H_J_mol: number;
  @ApiProperty() mu_Pa_s: number;
  @ApiProperty() lambda: number;
  @ApiProperty() rho_kg_m3: number;
  @ApiProperty() Pr: number;
  @ApiProperty() molecularWeight_kg_mol: number;
  @ApiPropertyOptional() diffusion?: Partial<Record<Species, number>>;
}

