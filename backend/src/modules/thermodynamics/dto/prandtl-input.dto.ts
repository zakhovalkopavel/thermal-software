import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { FlowGeometry } from '../enums/flow-geometry.enum';
import { GeometryDimsDto } from './geometry-dims.dto';
import { FluidStateDto } from './fluid-state.dto';

export class PrandtlInputDto {
  @ApiProperty({ enum: FlowGeometry }) @IsEnum(FlowGeometry) geometry: FlowGeometry;
  @ApiPropertyOptional({ type: GeometryDimsDto }) @IsOptional() @ValidateNested() @Type(() => GeometryDimsDto) dims?: GeometryDimsDto;
  @ApiProperty({ type: FluidStateDto }) @ValidateNested() @Type(() => FluidStateDto) fluid: FluidStateDto;
}

