import { ApiProperty } from '@nestjs/swagger';

export class FluidThermalConductivityResultDto {
  @ApiProperty({ description: 'Thermal conductivity λ [W/(m·K)]' })
  lambda: number;

  @ApiProperty({ description: 'Temperature at which λ was evaluated [K]' })
  T_K: number;
}

