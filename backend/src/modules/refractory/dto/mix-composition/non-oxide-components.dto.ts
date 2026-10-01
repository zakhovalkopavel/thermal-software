import { ApiPropertyOptional } from '@nestjs/swagger';

/** Non-oxide share of the fired mix [wt%], by component group. */
export class NonOxideComponentsDto {
  @ApiPropertyOptional({ description: 'Carbides (SiC, TiC, B4C, …) [wt%]' })
  carbide?: number;

  @ApiPropertyOptional({ description: 'Nitrides (Si3N4 as Si/N, AlN, BN, …) [wt%]' })
  nitride?: number;

  @ApiPropertyOptional({ description: 'Free carbon [wt%]' })
  carbon?: number;

  @ApiPropertyOptional({ description: 'Other non-oxide keys (e.g. Grog) [wt%]' })
  other?: number;
}
