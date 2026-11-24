import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EquationValidityDto } from '../shared/equation-validity.dto';
import { MixtureValidityDto } from '../shared/mixture-validity.dto';

export class FluidThermalConductivityResultDto {
  @ApiProperty({ description: 'Thermal conductivity λ [W/(m·K)]' })
  lambda: number;

  @ApiProperty({ description: 'Temperature at which λ was evaluated [K]' })
  T_K: number;

  @ApiPropertyOptional({ type: EquationValidityDto, description: 'Correlation boundary status' })
  validity?: EquationValidityDto;

  @ApiPropertyOptional({ type: MixtureValidityDto, description: 'Per-component boundary status for mixtures' })
  mixtureValidity?: MixtureValidityDto;
}

