import { ApiPropertyOptional } from '@nestjs/swagger';

export class MaterialThermalPropertiesDto {
  @ApiPropertyOptional({ description: 'Thermal conductivity λ [W/(m·K)]' })
  thermalConductivity_WmK?: number;

  @ApiPropertyOptional({ description: 'Specific heat Cp [J/(kg·K)]' })
  specificHeat_JkgK?: number;

  @ApiPropertyOptional({ description: 'Linear thermal expansion α [1/K]' })
  thermalExpansion_perK?: number;
}
