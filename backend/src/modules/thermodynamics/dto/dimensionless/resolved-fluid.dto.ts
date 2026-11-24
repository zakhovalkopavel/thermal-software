import { ApiPropertyOptional } from '@nestjs/swagger';
import { EquationValidityDto } from '../shared/equation-validity.dto';
import { MixtureValidityDto } from '../shared/mixture-validity.dto';

export class ResolvedFluidDto {
  @ApiPropertyOptional() rho_kg_m3?: number;
  @ApiPropertyOptional() mu_Pa_s?: number;
  @ApiPropertyOptional() Cp_J_kgK?: number;
  @ApiPropertyOptional({ description: 'Thermal conductivity [W/(m·K)]' }) lambda?: number;
  @ApiPropertyOptional() nu_m2s?: number;
  @ApiPropertyOptional({ type: EquationValidityDto, description: 'Aggregate transport/Cp boundary status' })
  validity?: EquationValidityDto;
  @ApiPropertyOptional({ type: MixtureValidityDto, description: 'Per-component boundary status' })
  mixtureValidity?: MixtureValidityDto;
}
