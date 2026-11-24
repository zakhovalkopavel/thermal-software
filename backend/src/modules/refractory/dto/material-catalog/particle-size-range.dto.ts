import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ParticleSizeRangeDto {
  @ApiProperty({ description: 'Minimum particle size [mm]' })
  dMin_mm: number;

  @ApiProperty({ description: 'Maximum particle size [mm]' })
  dMax_mm: number;

  @ApiProperty({ description: 'Median particle size [mm]' })
  d50_mm: number;

  @ApiProperty({ example: 'Fine 0.1–0.5mm' })
  grade: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiPropertyOptional()
  mesh?: string;

  @ApiPropertyOptional()
  name?: string;
}
