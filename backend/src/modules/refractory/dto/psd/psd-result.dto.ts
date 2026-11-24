import { ApiProperty } from '@nestjs/swagger';

const PSD_METHODS = ['Andreasen', 'FunkDinger'];

export class PsdResultDto {
  @ApiProperty({ enum: PSD_METHODS })
  method: string;

  @ApiProperty({ description: 'Distribution modulus' })
  q: number;

  @ApiProperty({ type: [Number], description: 'Mass fractions (0–1)' })
  massFractions: number[];

  @ApiProperty({ type: [Number], description: 'Mass fractions rounded to integer percent' })
  massFractionsRoundedPercent: number[];

  @ApiProperty({ description: 'Effective minimum diameter [mm]' })
  Dmin_mm: number;

  @ApiProperty({ description: 'Effective maximum diameter [mm]' })
  Dmax_mm: number;
}
