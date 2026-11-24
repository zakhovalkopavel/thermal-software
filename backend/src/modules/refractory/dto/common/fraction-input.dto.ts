import { IsNumber, IsOptional, IsString, IsBoolean, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class FractionInputDto {
  @ApiProperty({ example: 'uuid-material-id', required: false })
  @IsString() @IsOptional()
  materialId?: string;
  @ApiProperty({ example: 0.1 })
  @IsNumber() @Min(0)
  dMin_mm: number;
  @ApiProperty({ example: 1.0 })
  @IsNumber() @Min(0)
  dMax_mm: number;
  @ApiProperty({ example: false, required: false })
  @IsBoolean() @IsOptional()
  isFixed?: boolean;
  @ApiProperty({ example: 0.25, required: false })
  @IsNumber() @Min(0) @Max(1) @IsOptional()
  massFraction?: number;
  @ApiProperty({ example: 2700, required: false, description: 'Material density in kg/m³' })
  @IsNumber() @Min(1000) @Max(4000) @IsOptional()
  density_kgm3?: number;
}
