import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNumber, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { FlowGeometry } from '../enums/flow-geometry.enum';
import { GeometryDimsDto } from './geometry-dims.dto';

/**
 * Input for computing the convective heat transfer coefficient h [W/(m²·K)]
 * from a known Nusselt number:  h = Nu · λ / L
 */
export class HeatTransferCoefficientDto {
  @ApiProperty({ description: 'Nusselt number' }) @IsNumber() Nu: number;
  @ApiProperty({ description: 'Thermal conductivity [W/(m·K)]' }) @IsNumber() lambda: number;
  @ApiProperty({ enum: FlowGeometry }) @IsEnum(FlowGeometry) geometry: FlowGeometry;
  @ApiProperty({ type: GeometryDimsDto }) @ValidateNested() @Type(() => GeometryDimsDto) dims: GeometryDimsDto;
}

