import { ApiProperty } from '@nestjs/swagger';

export class WallPropertyPointDto {
  @ApiProperty({ description: 'Wall temperature [K]' })
  T_K: number;

  @ApiProperty({ description: 'Thermal conductivity λ [W/(m·K)]' })
  lambda_WmK: number;

  @ApiProperty({ description: 'Emissivity ε [0–1]' })
  emissivity: number;
}
