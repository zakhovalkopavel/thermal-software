import { ApiPropertyOptional } from '@nestjs/swagger';

export class ResolvedFluidDto {
  @ApiPropertyOptional() rho_kg_m3?: number;
  @ApiPropertyOptional() mu_Pa_s?: number;
  @ApiPropertyOptional() Cp_J_kgK?: number;
  @ApiPropertyOptional({ description: 'Thermal conductivity [W/(m·K)]' }) lambda?: number;
  @ApiPropertyOptional() nu_m2s?: number;
}
