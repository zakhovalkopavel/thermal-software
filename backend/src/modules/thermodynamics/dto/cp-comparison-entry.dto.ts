import { ApiProperty } from '@nestjs/swagger';

export class CpComparisonEntryDto {
  @ApiProperty() index: number;
  @ApiProperty({ description: 'Equation type (e.g. polynomial, nasa7)' }) type: string;
  @ApiProperty({ description: 'Reference key (literature source)' }) ref: string;
  @ApiProperty() value: number;
  @ApiProperty() rangeValid: boolean;
}

