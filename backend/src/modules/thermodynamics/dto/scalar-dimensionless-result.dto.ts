import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ScalarDimensionlessResultDto {
  @ApiProperty({ description: 'Computed value' }) value: number;
  @ApiProperty({ description: 'Symbol name (Re, Pr, Gr, Ra, h…)' }) symbol: string;
  @ApiProperty({ description: 'Characteristic length used [m]' }) L_m: number;
  @ApiPropertyOptional({ description: 'Resolved fluid properties used in calculation' })
  resolvedFluid?: {
    rho_kg_m3?: number;
    mu_Pa_s?: number;
    Cp_J_kgK?: number;
    lambda?: number;
    nu_m2s?: number;
  };
}

