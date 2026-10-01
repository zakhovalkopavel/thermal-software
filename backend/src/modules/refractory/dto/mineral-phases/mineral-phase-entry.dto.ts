import { ApiProperty } from '@nestjs/swagger';

export class MineralPhaseEntryDto {
  @ApiProperty({ example: 'Mullite' })
  phase: string;

  @ApiProperty({ example: '3Al2O3·2SiO2' })
  formula: string;

  @ApiProperty({ description: 'Share of the solid composition [%]' })
  percent: number;

  @ApiProperty({ description: 'Melting point [°C]' })
  meltingPoint: number;

  @ApiProperty()
  description: string;
}
