import {
  IsNumber,
  IsOptional,
  IsArray,
  ValidateNested,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { PsdFractionDto } from './psd-fraction.dto';

export class FunkDingerPsdDto {
  @ApiProperty({ type: [PsdFractionDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PsdFractionDto)
  fractions: PsdFractionDto[];

  @ApiProperty({ example: 0.26 })
  @IsNumber()
  @Min(0.01)
  @Max(1)
  q: number;

  @ApiProperty({ example: 0.001, required: false, description: 'Minimum diameter in mm (default: 0.001)' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  Dmin_mm?: number;

  @ApiProperty({ example: null, required: false })
  @IsNumber()
  @Min(0)
  @IsOptional()
  Dmax_mm?: number;
}
