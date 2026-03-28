import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNumber, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { FlowGeometry } from '../enums/flow-geometry.enum';
import { GeometryDimsDto } from './geometry-dims.dto';
import { FluidStateDto } from './fluid-state.dto';

export class ReynoldsInputDto {
  @ApiProperty({ enum: FlowGeometry }) @IsEnum(FlowGeometry) geometry: FlowGeometry;
  @ApiProperty({ type: GeometryDimsDto }) @ValidateNested() @Type(() => GeometryDimsDto) dims: GeometryDimsDto;
  @ApiProperty({ type: FluidStateDto, description: 'Fluid state (species + T [+ P]); w_m_s required here' })
  @ValidateNested() @Type(() => FluidStateDto) fluid: FluidStateDto;
}

