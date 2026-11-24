import { ApiProperty } from '@nestjs/swagger';

export class ThermalCriteriaDto {
  @ApiProperty({ description: 'Biot number' })        Bi: number;
  @ApiProperty({ description: 'Fourier number' })      Fo: number;
  @ApiProperty({ description: 'Rdist — heat-transfer characteristic length (m)' }) Rdist: number;
  @ApiProperty({ description: 'Rbi — Biot characteristic length (m)' })            Rbi: number;
}
