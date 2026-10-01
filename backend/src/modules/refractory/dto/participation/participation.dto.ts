import { IsNumber, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class ParticipationFractionDto {
  @ApiProperty({ example: 1.0, description: 'Lower sieve size in mm' })
  @IsNumber()
  dMin_mm: number;

  @ApiProperty({ example: 5.0, description: 'Upper sieve size in mm' })
  @IsNumber()
  dMax_mm: number;

  @ApiProperty({ example: 0.28, description: 'Mass fraction of this size class (0–1)' })
  @IsNumber()
  massFraction: number;
}

export class ParticipationDto {
  @ApiProperty({
    type: [ParticipationFractionDto],
    description: 'Array of particle size fractions with mass fractions',
    example: [
      { dMin_mm: 5.0, dMax_mm: 10.0, massFraction: 0.31 },
      { dMin_mm: 1.0, dMax_mm: 5.0,  massFraction: 0.28 },
      { dMin_mm: 0.1, dMax_mm: 1.0,  massFraction: 0.25 },
      { dMin_mm: 0.0, dMax_mm: 0.1,  massFraction: 0.16 },
    ],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ParticipationFractionDto)
  fractions: ParticipationFractionDto[];
}

