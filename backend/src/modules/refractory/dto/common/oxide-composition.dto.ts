import { IsNumber, IsOptional, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class OxideCompositionDto {
  @ApiProperty({ example: 50.5, required: false })
  @IsNumber() @Min(0) @Max(100) @IsOptional()
  SiO2?: number;
  @ApiProperty({ example: 30.2, required: false })
  @IsNumber() @Min(0) @Max(100) @IsOptional()
  Al2O3?: number;
  @ApiProperty({ example: 10.5, required: false })
  @IsNumber() @Min(0) @Max(100) @IsOptional()
  CaO?: number;
  @ApiProperty({ example: 5.0, required: false })
  @IsNumber() @Min(0) @Max(100) @IsOptional()
  MgO?: number;
  @ApiProperty({ example: 2.5, required: false })
  @IsNumber() @Min(0) @Max(100) @IsOptional()
  Fe2O3?: number;
  @ApiProperty({ example: 1.0, required: false })
  @IsNumber() @Min(0) @Max(100) @IsOptional()
  K2O?: number;
  @ApiProperty({ example: 0.3, required: false })
  @IsNumber() @Min(0) @Max(100) @IsOptional()
  Na2O?: number;
  @ApiProperty({ example: 0.5, required: false })
  @IsNumber() @Min(0) @Max(100) @IsOptional()
  TiO2?: number;
}
