import { ApiProperty } from '@nestjs/swagger';

export class CpComparisonEntryDto {
  @ApiProperty({ description: 'Zero-based index of this approximation in the compound registry' }) index: number;
  @ApiProperty({
    description:
      'Equation type used for this Cp approximation. ' +
      'Possible values: "polynomial", "alyLee" (DIPPR-107), "shomate", ' +
      '"dipprN102", "linear", "quadratic", "cubic", "quartic", "nasa7", "nasa9".',
    example: 'alyLee',
  })
  type: string;
  @ApiProperty({ description: 'Literature reference key (see GET /thermodynamics/fluid/list)', example: 'Perry7' }) ref: string;
  @ApiProperty({ description: 'Cp [J/(mol·K)] at the requested temperature', example: 29.12 }) value: number;
  @ApiProperty({ description: 'True if the requested temperature falls inside the equation validity range' }) rangeValid: boolean;
}
