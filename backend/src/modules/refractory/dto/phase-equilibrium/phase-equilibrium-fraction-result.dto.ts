import { ApiProperty } from '@nestjs/swagger';

export class PhaseEquilibriumFractionResultDto {
  @ApiProperty()
  materialId: string;

  @ApiProperty({ description: 'Median grain diameter [mm]' })
  d50_mm: number;

  @ApiProperty({ description: 'Normalised mass fraction of the mix [0–1]' })
  massFraction: number;

  @ApiProperty({ description: 'Penetration depth δ [mm]' })
  penetrationDepth_mm: number;

  @ApiProperty({ description: 'Reacted share of the fraction [%]' })
  reactedPercent: number;
}
