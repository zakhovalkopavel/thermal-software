import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { FlowGeometry } from '../enums/flow-geometry.enum';
import { GeometryDimsDto } from './geometry-dims.dto';
import { FluidStateDto } from './fluid-state.dto';

export class GrashofInputDto {
  @ApiProperty({ description: 'Hot-side (surface) temperature [K]' })  @IsNumber() @Min(1) T_hot_K: number;
  @ApiProperty({ description: 'Cold-side (fluid bulk) temperature [K]' }) @IsNumber() @Min(1) T_cold_K: number;
  @ApiProperty({ enum: FlowGeometry }) @IsEnum(FlowGeometry) geometry: FlowGeometry;
  @ApiProperty({ type: GeometryDimsDto }) @ValidateNested() @Type(() => GeometryDimsDto) dims: GeometryDimsDto;
  @ApiProperty({ type: FluidStateDto }) @ValidateNested() @Type(() => FluidStateDto) fluid: FluidStateDto;
  @ApiPropertyOptional({ description: 'Local gravitational acceleration [m/s²], default 9.80665' })
  @IsOptional() @IsNumber() g_m_s2?: number;
}

