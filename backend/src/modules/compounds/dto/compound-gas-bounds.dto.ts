import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BoilingPointSource } from '../../../common/thermal';

export class CompoundGasBoundsDto {
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
    description: 'Minimum gas-phase temperature [K] (= boiling temperature at P when known)',
    nullable: true,
    example: 373.15,
  })
  Tmin_K: number | null;

  @ApiProperty({
    description: 'Maximum temperature [K] from gas correlation ranges',
    nullable: true,
    example: 5000,
  })
  Tmax_K: number | null;

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
