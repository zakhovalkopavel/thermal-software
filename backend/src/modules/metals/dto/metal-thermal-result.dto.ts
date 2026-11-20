import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MetalLambdaModel } from '../enums/metal-lambda-model.enum';

export class MetalThermalResultDto {
  @ApiProperty() material: string;
  @ApiProperty() T_K: number;
  @ApiPropertyOptional({
    description:
      'Thermal conductivity [W/(m·K)]. Omitted when T is outside the table domain for this grade.',
  })
  lambda_WmK?: number;

  @ApiPropertyOptional({
    description: 'λ evaluation model used for this response',
    enum: MetalLambdaModel,
  })
  lambdaModel?: MetalLambdaModel;

  @ApiPropertyOptional({
    description: 'Carbon content [wt%] used when lambdaModel=kCT56',
  })
  C_wtPct?: number;

  @ApiPropertyOptional({ description: 'Emissivity (poly grades only)' })
  emissivity?: number;

  @ApiPropertyOptional({ description: 'Specific heat [J/(kg·K)] from table spline' })
  specificHeat_JkgK?: number;

  @ApiPropertyOptional({ description: 'Mean linear thermal expansion [10⁻⁶/K]' })
  thermalExpansion_1e6K?: number;

  @ApiPropertyOptional({ description: 'Density [kg/m³]' })
  density_kgm3?: number;

  @ApiPropertyOptional({ description: 'Electrical resistivity [Ω·m] from table spline' })
  electricalResistivity_OhmM?: number;

  @ApiPropertyOptional({ description: 'Donor provenance when a series was composition-filled' })
  donors?: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'Human-readable notes (e.g. donor reasons)' })
  notes?: string[];
}
