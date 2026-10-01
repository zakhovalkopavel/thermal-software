import { ApiProperty } from '@nestjs/swagger';

export class PhaseEquilibriumMetadataDto {
  @ApiProperty({ description: '[°C]' })
  temperature: number;

  @ApiProperty()
  totalMass: number;

  @ApiProperty({ description: '[°C]' })
  eutecticTemperature: number;

  @ApiProperty({ description: '[°C]' })
  estimatedLiquidus: number;

  @ApiProperty({ type: String, format: 'date-time' })
  calculatedAt: Date;
}
