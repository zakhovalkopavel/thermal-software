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

export class AndreasenPsdDto {
  @ApiProperty({ type: [PsdFractionDto], description: 'Particle size fractions' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PsdFractionDto)
  fractions: PsdFractionDto[];

  @ApiProperty({ example: 0.26, description: 'Distribution modulus q (0.2–0.4)' })
  @IsNumber()
  @Min(0.01)
  @Max(1)
  q: number;

  @ApiProperty({ example: null, required: false, description: 'Override Dmin in mm' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  Dmin_mm?: number;

  @ApiProperty({ example: null, required: false, description: 'Override Dmax in mm' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  Dmax_mm?: number;
}
