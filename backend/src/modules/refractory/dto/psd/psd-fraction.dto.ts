import {
  IsNumber,
  IsOptional,
  IsBoolean,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class PsdFractionDto {
  @ApiProperty({ example: 1.0, description: 'Lower sieve size in mm' })
  @IsNumber()
  @Min(0)
  dMin_mm: number;

  @ApiProperty({ example: 5.0, description: 'Upper sieve size in mm' })
  @IsNumber()
  @Min(0)
  dMax_mm: number;

  @ApiProperty({ example: false, required: false, description: 'Lock this fraction' })
  @IsBoolean()
  @IsOptional()
  isFixed?: boolean;

  @ApiProperty({ example: 0.25, required: false, description: 'Fixed mass fraction (required if isFixed=true)' })
  @IsNumber()
  @Min(0)
  @Max(1)
  @IsOptional()
  massFraction?: number;
}
