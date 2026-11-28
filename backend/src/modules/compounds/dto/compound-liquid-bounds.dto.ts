import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BoilingPointSource } from '../../../common/thermal';

export class CompoundLiquidBoundsDto {
  @ApiProperty({ example: 'water' })
  id: string;

  @ApiProperty({ nullable: true, example: '7732-18-5' })
  cas: string | null;

  @ApiProperty({ example: 'water' })
  name: string;

  @ApiProperty({ example: 'H2O' })
  formula: string;

  @ApiProperty({ example: 'H2O' })
  displayFormula: string;

  @ApiProperty({ example: 101325 })
  P_Pa: number;

  @ApiProperty({
    description: 'True when liquid μ, λ, ρ and Cp equations are available',
    example: true,
  })
  capable: boolean;

  @ApiProperty({
    description: 'Minimum liquid-phase temperature [K] (melting point or equation floor)',
    nullable: true,
    example: 273.15,
  })
  Tmin_K: number | null;

  @ApiProperty({
    description: 'Maximum liquid-phase temperature [K] (Tb at P, capped by equation ceilings)',
    nullable: true,
    example: 373.15,
  })
  Tmax_K: number | null;

  @ApiProperty({ nullable: true, example: 273.15 })
  meltingPoint_K: number | null;

  @ApiProperty({ nullable: true, example: 373.15 })
  boilingPoint_K: number | null;

  @ApiProperty({
    nullable: true,
    enum: ['vaporPressure', 'normalBoilingPoint'],
    example: 'vaporPressure',
  })
  boilingPointSource: BoilingPointSource | null;

  @ApiProperty({ nullable: true, example: 373.15 })
  normalBoilingPoint_K: number | null;

  @ApiPropertyOptional()
  message?: string;
}
