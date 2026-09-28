import { ApiProperty } from '@nestjs/swagger';

export class MaterialParticleSizeDto {
  @ApiProperty({ description: 'Minimum particle size [mm]' })
  dMin_mm: number;

  @ApiProperty({ description: 'Maximum particle size [mm]' })
  dMax_mm: number;

  @ApiProperty({ description: 'Median particle size [mm]' })
  d50_mm: number;
}
