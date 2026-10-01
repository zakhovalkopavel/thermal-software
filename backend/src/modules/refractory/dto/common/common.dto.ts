import { IsNumber, IsOptional, IsString, IsBoolean, Min, Max } from 'class-validator';
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
