import { IsNotEmpty, IsNumber, IsArray, IsString, IsOptional, IsObject, ValidateNested, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { FractionInputDto } from './common.dto';
export class BlendOptimizationOptionsDto {
  @ApiProperty({ example: [0.25, 0.27, 0.30], required: false })
  @IsArray() @IsNumber({}, { each: true }) @IsOptional()
  qValues?: number[];
  @ApiProperty({ example: ['Andreasen', 'FunkDinger'], required: false })
  @IsArray() @IsString({ each: true }) @IsOptional()
  methods?: string[];
  @ApiProperty({ example: ['CPM', 'Furnas'], required: false })
  @IsArray() @IsString({ each: true }) @IsOptional()
  packingModels?: string[];
  @ApiProperty({ example: ['Self-compacting', 'Flowable'], required: false })
  @IsArray() @IsString({ each: true }) @IsOptional()
  scenarios?: string[];
  @ApiProperty({ example: [600, 800, 1000, 1200], required: false })
  @IsArray() @IsNumber({}, { each: true }) @IsOptional()
  temperatureProfile_C?: number[];
  @ApiProperty({ example: 0.35, required: false })
  @IsNumber() @Min(0) @Max(1) @IsOptional()
  waterCementRatio?: number;
}
export class BlendOptimizationDto {
  @ApiProperty({ type: [FractionInputDto] })
  @IsNotEmpty() @IsArray() @ValidateNested({ each: true })
  @Type(() => FractionInputDto)
  fractions: FractionInputDto[];
  @ApiProperty({ type: BlendOptimizationOptionsDto, required: false })
  @IsObject() @ValidateNested() @Type(() => BlendOptimizationOptionsDto) @IsOptional()
  options?: BlendOptimizationOptionsDto;
}
