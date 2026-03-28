import { IsEnum, IsNumber, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BodyGeometry } from '../enums/body-geometry.enum';
import { GeometryDimsDto } from './geometry-dims.dto';

export class BodyGeometryInputDto {
  @ApiProperty({ enum: BodyGeometry })
  @IsEnum(BodyGeometry)
  geometry: BodyGeometry;

  @ApiPropertyOptional({ description: 'Insulation thickness [m]' })
  @IsOptional() @IsNumber() h?: number;

  @ApiProperty({ type: GeometryDimsDto })
  @ValidateNested() @Type(() => GeometryDimsDto)
  dims: GeometryDimsDto;
}

